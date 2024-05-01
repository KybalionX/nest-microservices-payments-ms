import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { Services, envs } from 'src/config';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecretKey);

  constructor(
    @Inject(Services.NATS_SERVICE) private readonly natsClient: ClientProxy,
  ) {}

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;

    const lineItems = items.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: { orderId },
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: envs.stripeSucessUrl,
      cancel_url: envs.stripeCancelurl,
    });

    return {
      cancelUrl: session.cancel_url,
      successUrl: session.success_url,
      url: session.url,
    };
  }

  success() {
    return `This action returns all payments`;
  }

  cancel(id: number) {
    return `This action returns a #${id} payment`;
  }

  async stripeWebHook(req: Request, res: Response) {
    const stripeSignature = req.headers['stripe-signature'];
    const endpointSecret = envs.stripeEndpointSecret;
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        stripeSignature,
        endpointSecret,
      );
    } catch (error) {
      res.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucceded = event.data.object;
        this.natsClient.emit('payment.succeeded', {
          stripePaymentId: chargeSucceded.id,
          orderId: +chargeSucceded.metadata.orderId,
          receiptUrl: chargeSucceded.receipt_url,
        });
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json({ stripeSignature });
  }
}

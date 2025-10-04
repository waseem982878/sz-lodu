
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OrderService } from "@/services/order.service";
import { PaymentService } from "@/services/payment.service";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, CheckCircle, Clock, XCircle } from "lucide-react";
import type { Order } from "@/models/order.model";
import type { PaymentRequest } from "@/models/payment-upi.model";

export default function PaymentPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadOrderAndPayment();
  }, [orderId]);

  const loadOrderAndPayment = async () => {
    try {
      const orderData = await OrderService.getOrder(orderId);
      setOrder(orderData);

      if (orderData?.paymentRequestId) {
        const paymentData = await PaymentService.getPaymentRequest(orderData.paymentRequestId);
        setPaymentRequest(paymentData);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createPaymentRequest = async () => {
    if (!order) return;
    
    setCreatingPayment(true);
    try {
      const newPaymentRequest = await PaymentService.createPaymentRequest(
        order, 
        `Payment for order #${order.orderNumber}`
      );
      setPaymentRequest(newPaymentRequest);
    } catch (error) {
      console.error("Failed to create payment request:", error);
      alert("Failed to create payment request: " + (error as Error).message);
    } finally {
      setCreatingPayment(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: <Clock className="h-4 w-4" />, label: 'Pending' },
      completed: { variant: 'default' as const, icon: <CheckCircle className="h-4 w-4" />, label: 'Paid' },
      failed: { variant: 'destructive' as const, icon: <XCircle className="h-4 w-4" />, label: 'Failed' },
      expired: { variant: 'outline' as const, icon: <XCircle className="h-4 w-4" />, label: 'Expired' }
    };

    const config = variants[status as keyof typeof variants] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold text-destructive">Order not found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">Complete Your Payment</h1>
        <p className="text-muted-foreground">Order #{order.orderNumber}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-bold">₹{order.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              {getStatusBadge(order.status)}
            </div>
          </div>
        </CardContent>
      </Card>

      {!paymentRequest ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Payment Request</CardTitle>
            <CardDescription>
              Generate a UPI payment request for your order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createPaymentRequest} 
              disabled={creatingPayment}
              className="w-full"
            >
              {creatingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Payment Request...
                </>
              ) : (
                'Generate UPI Payment'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment Instructions</CardTitle>
            <CardDescription>
              Send payment using any UPI app to the details below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">UPI ID</Label>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-3 py-2 rounded-md flex-1">
                    {paymentRequest.upiId}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(paymentRequest.upiId, 'upi')}
                  >
                    {copiedField === 'upi' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Payee Name</Label>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-3 py-2 rounded-md flex-1">
                    {paymentRequest.payeeName}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(paymentRequest.payeeName, 'name')}
                  >
                    {copiedField === 'name' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount</Label>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-3 py-2 rounded-md flex-1">
                  ₹{paymentRequest.amount.toLocaleString()}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(paymentRequest.amount.toString(), 'amount')}
                >
                  {copiedField === 'amount' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {paymentRequest.description && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground">{paymentRequest.description}</p>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Payment Status</p>
                <p className="text-sm text-muted-foreground">
                  Expires at {new Date(paymentRequest.expiresAt).toLocaleString()}
                </p>
              </div>
              {getStatusBadge(paymentRequest.status)}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800">Important Instructions:</h4>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Use any UPI app (GPay, PhonePe, Paytm, etc.)</li>
                <li>• Enter the exact amount shown above</li>
                <li>• Use the UPI ID and payee name provided</li>
                <li>• Save the transaction ID for verification</li>
                <li>• Payment will be verified manually within 30 minutes</li>
              </ul>
            </div>

            <Button 
              onClick={loadOrderAndPayment}
              variant="outline"
              className="w-full"
            >
              <Loader2 className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

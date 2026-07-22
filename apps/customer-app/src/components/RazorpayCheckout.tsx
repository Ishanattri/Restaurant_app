import React, { useMemo } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { colors } from "@restaurant-app/shared";

export interface RazorpaySuccess {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

interface Props {
  visible: boolean;
  keyId: string;
  orderId: string;
  amount: number;
  name: string;
  email?: string;
  contact?: string;
  onSuccess: (result: RazorpaySuccess) => void;
  onCancel: () => void;
}

function buildCheckoutHtml(opts: {
  keyId: string;
  orderId: string;
  amount: number;
  name: string;
  email?: string;
  contact?: string;
}): string {
  const options = {
    key: opts.keyId,
    order_id: opts.orderId,
    amount: Math.round(opts.amount * 100),
    currency: "INR",
    name: "Restaurant App",
    description: "Order payment",
    prefill: { name: opts.name, email: opts.email ?? "", contact: opts.contact ?? "" },
    theme: { color: "#f97316" },
  };
  return `
<!DOCTYPE html>
<html>
  <head><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
  <body style="margin:0;padding:0;background:#fff;">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      function post(msg) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
      var options = ${JSON.stringify(options)};
      options.handler = function (response) {
        post({
          status: "success",
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      };
      options.modal = {
        ondismiss: function () {
          post({ status: "cancelled" });
        },
      };
      var rzp = new Razorpay(options);
      rzp.on("payment.failed", function (response) {
        post({ status: "error", description: response.error.description });
      });
      rzp.open();
    </script>
  </body>
</html>`;
}

export function RazorpayCheckout({ visible, keyId, orderId, amount, name, email, contact, onSuccess, onCancel }: Props) {
  const html = useMemo(
    () => buildCheckoutHtml({ keyId, orderId, amount, name, email, contact }),
    [keyId, orderId, amount, name, email, contact]
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.webviewWrap}>
          <WebView
            originWhitelist={["*"]}
            source={{ html }}
            onMessage={(event) => {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.status === "success") {
                onSuccess({
                  razorpayOrderId: data.razorpayOrderId,
                  razorpayPaymentId: data.razorpayPaymentId,
                  razorpaySignature: data.razorpaySignature,
                });
              } else {
                onCancel();
              }
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  webviewWrap: { flex: 1 },
});

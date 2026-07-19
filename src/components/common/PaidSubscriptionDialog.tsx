import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Modal, Text, Button } from 'react-native-paper';
import { THEME_COLORS } from '../../constants';

interface PaidSubscriptionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  templateName?: string;
  onViewPricing: () => void;
}

export default function PaidSubscriptionDialog({
  visible,
  onDismiss,
  templateName = 'this premium template',
  onViewPricing,
}: PaidSubscriptionDialogProps) {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.crownIcon}>👑</Text>
          <Text style={styles.title}>Premium Template</Text>
        </View>

        <Text style={styles.subtitle}>
          "{templateName}" is available with a paid subscription.
        </Text>

        <Text style={styles.description}>
          Unlock premium templates, advanced exports, and more by upgrading to a plan that fits your workflow.
        </Text>

        <View style={styles.featuresList}>
          <Text style={styles.featuresHeading}>What you get:</Text>
          <Text style={styles.featureItem}>✨ Premium templates & styling options</Text>
          <Text style={styles.featureItem}>✨ Faster workflow + export-ready designs</Text>
          <Text style={styles.featureItem}>✨ Cancel anytime (as per our subscription policy)</Text>
        </View>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.button}
            textColor="#475569"
          >
            Not now
          </Button>
          <Button
            mode="contained"
            onPress={onViewPricing}
            style={[styles.button, styles.viewPricingBtn]}
            buttonColor={THEME_COLORS.primary}
          >
            View Pricing
          </Button>
        </View>

        <Text style={styles.footer}>
          You can return after subscribing to continue editing this template.
        </Text>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 24,
    margin: 20,
    borderRadius: 16,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  crownIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 18,
  },
  featuresList: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  featuresHeading: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 6,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    borderRadius: 24,
  },
  viewPricingBtn: {
    // Custom buttonColor already defined on the component
  },
  footer: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 14,
  },
});

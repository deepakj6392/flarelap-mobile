import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Card, Text, Title, Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import api from '../services/api.service';
import { RAZORPAY_KEY_ID } from '../constants/config';
import { THEME_COLORS } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPlans } from '../services/plan.service';
import { AxiosError } from 'axios';

export default function PricingScreen() {
  const navigation = useNavigation();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [user, setUser] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch public plans
      const plansRes = await fetchPlans();
      if (plansRes?.plans) {
        // Filter out plans with price < 1 or inactive if needed, but display all configured plans
        setPlans(plansRes.plans);
      }

      // Fetch user profile (to prefill Razorpay name/email)
      try {
        const userRes = await api.get('/auth/me');
        if (userRes.data?.user) {
          setUser(userRes.data.user);
        }
      } catch (userErr) {
        console.warn('Failed to fetch user details:', userErr);
      }

      // Fetch current subscription status
      try {
        const subsRes = await api.get('/api/subscriptions/me');
        const hasActive = Array.isArray(subsRes.data?.subscriptions) &&
          subsRes.data.subscriptions.some((sub: any) => sub.status === 'active');
        setIsSubscribed(!!hasActive);
      } catch (subsErr) {
        console.warn('Failed to fetch subscription status:', subsErr);
      }
    } catch (error: any) {
      if(error instanceof AxiosError) {
        console.error('Failed to load pricing details:11', error.response);
        Alert.alert('Error', error.response?.data?.message || 'Failed to load subscription details. Please try again.');
      }
      else {
        console.error('Failed to load pricing details:', error);
        Alert.alert('Error', 'Failed to load subscription details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubscribe = async (plan: any) => {
    if (isSubscribed) {
      Alert.alert('Already Subscribed', 'You already have an active subscription.');
      return;
    }

    try {
      // Create subscription order on backend
      const orderRes = await api.post('/subscriptions/create-order', { planId: plan.id });
      const order = orderRes.data?.order;
      const subscription = orderRes.data?.subscription;

      if (order && order.id) {
        const options = {
          key: RAZORPAY_KEY_ID || orderRes.data?.key_id,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'Flarelap',
          description: `Subscription to ${plan.title || 'Pro Plan'}`,
          order_id: order.id,
          prefill: {
            name: user?.fullName || '',
            email: user?.email || '',
          },
          theme: {
            color: THEME_COLORS.primary,
          },
        };

        RazorpayCheckout.open(options)
          .then(async (data: any) => {
            const { razorpay_order_id, razorpay_payment_id } = data;
            setLoading(true);
            try {
              // Confirm subscription on backend
              await api.post('/api/subscriptions/confirm', {
                subscriptionId: subscription.id,
                razorpayPaymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
              });
              Alert.alert('Success', 'Your subscription is now active!');
              fetchData();
            } catch (err: any) {
              Alert.alert('Verification Failed', err?.response?.data?.message || 'Could not verify payment');
              setLoading(false);
            }
          })
          .catch((err: any) => {
            console.warn('Razorpay Checkout closed/failed:', err);
            Alert.alert('Payment Cancelled', err?.description || 'Subscription payment was not completed.');
          });
      } else {
        throw new Error('Order creation did not return a valid order ID.');
      }
    } catch (err: any) {
      console.error('Failed to initiate subscription:', err);
      Alert.alert('Subscription Error', err?.response?.data?.message || err?.message || 'Failed to start subscription process.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Title style={styles.headerTitle}>Subscription Plans</Title>
        <View style={styles.headerPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={THEME_COLORS.primary} />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Simple & transparent pricing</Text>
          <Text style={styles.subtitle}>Choose the plan that's right for you. Start editing with unlimited premium resources.</Text>

          {plans.length === 0 ? (
            <Text style={styles.emptyText}>No plans available at this time.</Text>
          ) : (
            plans.map((plan, index) => {
              const priceVal = plan.price === 'Custom' ? 'Custom' : `₹${plan.price}`;
              const featuresList = Array.isArray(plan.features) ? plan.features : [];
              
              return (
                <Card key={plan.id || index} style={[styles.card, plan.isPopular && styles.popularCard]} mode="outlined">
                  {plan.isPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                    </View>
                  )}
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <Text style={styles.planSubtitle}>{plan.subtitle}</Text>

                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>{priceVal}</Text>
                      {plan.price !== 'Custom' && (
                        <Text style={styles.period}> / {plan.billingPeriod || 'month'}</Text>
                      )}
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.features}>
                      {featuresList.map((feature: string, fIdx: number) => (
                        <View key={fIdx} style={styles.featureRow}>
                          <Text style={styles.featureCheck}>✓</Text>
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>

                    {isSubscribed ? (
                      <Button
                        mode="contained"
                        disabled
                        style={[styles.button, styles.subscribedBtn]}
                      >
                        Subscribed
                      </Button>
                    ) : (
                      <Button
                        mode={plan.isPopular ? 'contained' : 'outlined'}
                        onPress={() => handleSubscribe(plan)}
                        style={styles.button}
                        buttonColor={plan.isPopular ? THEME_COLORS.primary : undefined}
                        textColor={plan.isPopular ? '#ffffff' : THEME_COLORS.primary}
                        disabled={plan.price === 0 || plan.price === 'Free'}
                      >
                        Subscribe Now
                      </Button>
                    )}
                  </Card.Content>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerPlaceholder: {
    width: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  popularCard: {
    borderColor: THEME_COLORS.primary,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: THEME_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    paddingTop: 16,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
  },
  period: {
    fontSize: 14,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
  },
  features: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureCheck: {
    color: THEME_COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
    lineHeight: 18,
  },
  featureText: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 18,
    flex: 1,
  },
  button: {
    borderRadius: 24,
  },
  subscribedBtn: {
    backgroundColor: '#cbd5e1',
  },
});

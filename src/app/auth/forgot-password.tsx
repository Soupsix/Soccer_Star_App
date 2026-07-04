import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { sendPasswordResetEmail } from 'firebase/auth';

import { auth } from '@/services/firebase';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

const ForgotSchema = Yup.object().shape({
  email: Yup.string()
    .email('Địa chỉ email không hợp lệ')
    .required('Vui lòng nhập email'),
});

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleResetPassword = async (values: any, { setSubmitting }: any) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setSuccessMsg('Liên kết khôi phục mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác) để đặt lại mật khẩu.');
      setTimeout(() => {
        router.replace('/auth/login');
      }, 4000);
    } catch (err: any) {
      console.error(err);
      let message = 'Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại.';
      if (err.code === 'auth/user-not-found') {
        message = 'Tài khoản không tồn tại.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Địa chỉ email không hợp lệ.';
      }
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <IconSymbol size={24} name="chevron.left.forwardslash.chevron.right" color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
              Quên Mật Khẩu
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: '#A0AEC0' }]}>
              Nhập email đăng ký của bạn. Chúng tôi sẽ gửi liên kết để đặt lại mật khẩu của bạn.
            </ThemedText>
          </View>

          {/* Form */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {errorMsg && (
              <View style={[styles.errorContainer, { backgroundColor: '#FF4D4F' + '20' }]}>
                <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
              </View>
            )}

            {successMsg && (
              <View style={[styles.successContainer, { backgroundColor: colors.success + '20' }]}>
                <ThemedText style={[styles.successText, { color: colors.success }]}>{successMsg}</ThemedText>
              </View>
            )}

            <Formik
              initialValues={{ email: '' }}
              validationSchema={ForgotSchema}
              onSubmit={handleResetPassword}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isSubmitting,
              }) => (
                <View style={styles.form}>
                  {/* Email Field */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>EMAIL</ThemedText>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <TextInput
                        placeholder="example@email.com"
                        placeholderTextColor="#64748B"
                        style={[styles.input, { color: colors.text }]}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={handleChange('email')}
                        onBlur={handleBlur('email')}
                        value={values.email}
                      />
                    </View>
                    {touched.email && errors.email && (
                      <ThemedText style={styles.validationError}>{errors.email}</ThemedText>
                    )}
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleSubmit()}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <ThemedText style={styles.submitBtnText}>GỬI EMAIL YÊU CẦU</ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>

          {/* Back to Login Redirect */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <ThemedText style={[styles.linkText, { color: colors.primary, fontWeight: 'bold' }]}>
                Quay lại đăng nhập
              </ThemedText>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 32,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF4D4F',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  successContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A0AEC0',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputWrapper: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  validationError: {
    color: '#FF4D4F',
    fontSize: 12,
    marginTop: 6,
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2F80ED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  linkText: {
    fontSize: 14,
  },
});

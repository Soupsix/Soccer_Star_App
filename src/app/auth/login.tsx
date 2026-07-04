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
import { signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from '@/services/firebase';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Địa chỉ email không hợp lệ')
    .required('Vui lòng nhập email'),
  password: Yup.string()
    .min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự')
    .required('Vui lòng nhập mật khẩu'),
});

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (values: any, { setSubmitting }: any) => {
    setErrorMsg(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      // Navigation will be automatically updated by Auth State Listener in Layout
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error(err);
      let message = 'Đã xảy ra lỗi đăng nhập. Vui lòng thử lại.';
      if (err.code === 'auth/invalid-credential') {
        message = 'Email hoặc mật khẩu không chính xác.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'Tài khoản không tồn tại.';
      } else if (err.code === 'auth/wrong-password') {
        message = 'Mật khẩu không chính xác.';
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
          
          {/* Logo & Header */}
          <View style={styles.headerContainer}>
            <View style={[styles.logoIcon, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol size={48} name="paperplane.fill" color={colors.primary} />
            </View>
            <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
              Football Star <ThemedText style={{ color: colors.gold }}>AI</ThemedText>
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: '#A0AEC0' }]}>
              Trải nghiệm dự đoán bóng đá thông minh hàng đầu
            </ThemedText>
          </View>

          {/* Form */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText type="subtitle" style={styles.cardTitle}>Đăng Nhập</ThemedText>
            
            {errorMsg && (
              <View style={[styles.errorContainer, { backgroundColor: '#FF4D4F' + '20' }]}>
                <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
              </View>
            )}

            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={LoginSchema}
              onSubmit={handleLogin}
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

                  {/* Password Field */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>MẬT KHẨU</ThemedText>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor="#64748B"
                        style={[styles.input, { color: colors.text }]}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={handleChange('password')}
                        onBlur={handleBlur('password')}
                        value={values.password}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                      >
                        <IconSymbol
                          size={20}
                          name={showPassword ? 'house.fill' : 'house.fill'} // fallback simple icon
                          color="#A0AEC0"
                        />
                      </TouchableOpacity>
                    </View>
                    {touched.password && errors.password && (
                      <ThemedText style={styles.validationError}>{errors.password}</ThemedText>
                    )}
                  </View>

                  {/* Forgot Password Link */}
                  <TouchableOpacity
                    onPress={() => router.push('/auth/forgot-password')}
                    style={styles.forgotBtn}
                  >
                    <ThemedText style={[styles.linkText, { color: colors.primary }]}>
                      Quên mật khẩu?
                    </ThemedText>
                  </TouchableOpacity>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleSubmit()}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <ThemedText style={styles.submitBtnText}>ĐĂNG NHẬP</ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>

          {/* Register Redirect */}
          <View style={styles.footer}>
            <ThemedText style={{ color: '#A0AEC0' }}>Bạn chưa có tài khoản? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <ThemedText style={[styles.linkText, { color: colors.primary, fontWeight: 'bold' }]}>
                Đăng ký ngay
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
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
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
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
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
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
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
  eyeBtn: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  validationError: {
    color: '#FF4D4F',
    fontSize: 12,
    marginTop: 6,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  linkText: {
    fontSize: 14,
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
    marginBottom: 16,
  },
});

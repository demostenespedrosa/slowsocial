import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../navigation/main_navigation_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isSignUp = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleAuth() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Preencha seu e-mail e senha.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    // Em produção com credenciais reais do Supabase:
    // if (_isSignUp) {
    //   await Supabase.instance.client.auth.signUp(email: email, password: password);
    // } else {
    //   await Supabase.instance.client.auth.signInWithPassword(email: email, password: password);
    // }

    await Future.delayed(const Duration(milliseconds: 600)); // Simulação de autenticação rápida
    setState(() => _isLoading = false);

    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainNavigationShell()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            physics: const BouncingScrollPhysics(),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo Ícone SlowSocial
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: isDark
                        ? AppColors.darkLilac.withOpacity(0.18)
                        : AppColors.lilacPrimary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: isDark
                          ? AppColors.darkLilac.withOpacity(0.35)
                          : AppColors.lilacPrimary.withOpacity(0.25),
                      width: 1.5,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      'S',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: isDark ? const Color(0xFFD2C7F5) : const Color(0xFF5E47A3),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                const Text(
                  'SlowSocial',
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, letterSpacing: -0.5),
                ),
                const SizedBox(height: 8),

                Text(
                  'Conexões significativas, profundidade assíncrona e silêncio produtivo.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13.5,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
                const SizedBox(height: 36),

                // Cartão de Credenciais
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                  child: Column(
                    children: [
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        style: const TextStyle(fontSize: 14.5),
                        decoration: const InputDecoration(
                          hintText: 'Seu e-mail',
                          prefixIcon: Icon(Icons.mail_outline_rounded, size: 20),
                          border: InputBorder.none,
                        ),
                      ),
                      const Divider(height: 20),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        style: const TextStyle(fontSize: 14.5),
                        decoration: const InputDecoration(
                          hintText: 'Sua senha',
                          prefixIcon: Icon(Icons.lock_outline_rounded, size: 20),
                          border: InputBorder.none,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Botão de Entrar
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleAuth,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.lilacPrimary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(26),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : Text(
                            _isSignUp ? 'Criar Conta Consciente' : 'Entrar no SlowSocial',
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
                const SizedBox(height: 16),

                // Alternar Entrar / Cadastrar
                TextButton(
                  onPressed: () => setState(() => _isSignUp = !_isSignUp),
                  child: Text(
                    _isSignUp
                        ? 'Já tem uma conta? Entrar'
                        : 'Ainda não é membro? Criar conta',
                    style: TextStyle(
                      color: isDark ? AppColors.darkLilac : AppColors.lilacPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

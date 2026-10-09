import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Em produção, inicializar Supabase e Firebase aqui:
  // await Supabase.initialize(url: '...', anonKey: '...');
  // await Firebase.initializeApp();

  runApp(
    const ProviderScope(
      child: SlowSocialApp(),
    ),
  );
}

class SlowSocialApp extends StatelessWidget {
  const SlowSocialApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SlowSocial',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system, // Acompanha o sistema (iOS/Android)
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkLilac.withOpacity(0.2) : AppColors.lilacPrimary.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isDark ? AppColors.darkLilac.withOpacity(0.3) : AppColors.lilacPrimary.withOpacity(0.25),
                ),
              ),
              child: Center(
                child: Text(
                  'S',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isDark ? const Color(0xFFD2C7F5) : const Color(0xFF5E47A3),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            const Text('SlowSocial'),
          ],
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.spa_rounded,
                size: 56,
                color: isDark ? AppColors.darkLilac : AppColors.lilacPrimary,
              ),
              const SizedBox(height: 16),
              const Text(
                'Rede Social Consciente e Calma',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Flutter + Go + Postgres + Redis + Kafka + Supabase Auth',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

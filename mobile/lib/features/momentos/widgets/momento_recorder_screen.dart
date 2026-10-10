import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/theme/app_theme.dart';

class MomentoRecorderScreen extends ConsumerStatefulWidget {
  const MomentoRecorderScreen({super.key});

  @override
  ConsumerState<MomentoRecorderScreen> createState() => _MomentoRecorderScreenState();
}

class _MomentoRecorderScreenState extends ConsumerState<MomentoRecorderScreen> {
  final TextEditingController _textController = TextEditingController();
  final TextEditingController _mediaUrlController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _textController.dispose();
    _mediaUrlController.dispose();
    super.dispose();
  }

  Future<void> _submitMomento() async {
    final text = _textController.text.trim();
    final media = _mediaUrlController.text.trim();

    if (text.isEmpty && media.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Adicione uma foto ou uma frase de reflexão.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final dio = ref.read(apiClientProvider).client;
      final res = await dio.post('/momentos', data: {
        'text_note': text,
        'media_url': media,
        'expires_in_hours': 24,
      });

      setState(() => _isLoading = false);

      if (res.statusCode == 201 && mounted) {
        ref.refresh(momentosProvider);
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Momento publicado! Expira em 24h. ⏳')),
        );
      }
    } catch (_) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Falha ao publicar momento.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.lightBg,
      appBar: AppBar(
        title: const Text('Compartilhar Momento (24h)'),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12, top: 8, bottom: 8),
            child: ElevatedButton(
              onPressed: _isLoading ? null : _submitMomento,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.lilacPrimary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 18),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Postar', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
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
                    controller: _textController,
                    maxLines: 4,
                    style: const TextStyle(fontSize: 16),
                    decoration: const InputDecoration(
                      hintText: 'O que você está vivenciando no seu dia? (Texto do story)',
                      border: InputBorder.none,
                    ),
                  ),
                  const Divider(height: 24),
                  TextField(
                    controller: _mediaUrlController,
                    style: const TextStyle(fontSize: 14),
                    decoration: const InputDecoration(
                      hintText: 'URL da imagem (opcional)',
                      prefixIcon: Icon(Icons.image_outlined, size: 20),
                      border: InputBorder.none,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.access_time_rounded, size: 16, color: AppColors.lilacPrimary),
                const SizedBox(width: 8),
                Text(
                  'Este momento será visível apenas para suas conexões e desaparecerá em 24h.',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

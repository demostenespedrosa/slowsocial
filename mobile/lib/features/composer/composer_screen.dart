import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/app_providers.dart';
import '../../core/theme/app_theme.dart';

class ComposerScreen extends ConsumerStatefulWidget {
  const ComposerScreen({super.key});

  @override
  ConsumerState<ComposerScreen> createState() => _ComposerScreenState();
}

class _ComposerScreenState extends ConsumerState<ComposerScreen> {
  final TextEditingController _contentController = TextEditingController();
  String _selectedFormat = 'thought'; // thought, article, audio_memo, code_snippet
  bool _isLoading = false;

  final List<Map<String, String>> _formats = [
    {'id': 'thought', 'label': '💭 Pensamento'},
    {'id': 'article', 'label': '📝 Ensaio'},
    {'id': 'code_snippet', 'label': '💻 Código'},
    {'id': 'audio_memo', 'label': '🎙️ Áudio'},
  ];

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _submitPost() async {
    final text = _contentController.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Escreva algo antes de publicar.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final api = ref.read(apiServiceProvider);
    final success = await api.createPost(
      content: text,
      formatType: _selectedFormat,
    );

    setState(() => _isLoading = false);

    if (success && mounted) {
      ref.refresh(feedProvider);
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Publicação compartilhada com calma. ✨')),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Falha ao publicar. Tente novamente.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nova Publicação'),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12, top: 8, bottom: 8),
            child: ElevatedButton(
              onPressed: _isLoading ? null : _submitPost,
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
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'Publicar',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Seletor de Formato
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: _formats.map((f) {
                final isSelected = _selectedFormat == f['id'];
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(f['label']!),
                    selected: isSelected,
                    onSelected: (_) => setState(() => _selectedFormat = f['id']!),
                    selectedColor: AppColors.lilacPrimary.withOpacity(0.2),
                    backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                    labelStyle: TextStyle(
                      color: isSelected
                          ? (isDark ? AppColors.darkLilac : AppColors.lilacPrimary)
                          : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(
                        color: isSelected
                            ? AppColors.lilacPrimary
                            : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          const Divider(height: 1),

          // Campo de Texto de Alta Legibilidade
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _contentController,
                maxLines: null,
                expands: true,
                textAlignVertical: TextAlignVertical.top,
                style: TextStyle(
                  fontSize: 16,
                  height: 1.5,
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                ),
                decoration: InputDecoration(
                  hintText: _getPlaceholderForFormat(_selectedFormat),
                  hintStyle: TextStyle(
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                  border: InputBorder.none,
                ),
              ),
            ),
          ),

          // Rodapé com Dicas de Atenção e Calma
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
              border: Border(
                top: BorderSide(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  width: 0.5,
                ),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.eco_rounded,
                  size: 16,
                  color: AppColors.lilacPrimary,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'No SlowSocial, o conteúdo é distribuído de forma orgânica e assíncrona.',
                    style: TextStyle(
                      fontSize: 11.5,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getPlaceholderForFormat(String format) {
    switch (format) {
      case 'article':
        return 'Compartilhe um ensaio com introdução, contexto e conclusões...';
      case 'code_snippet':
        return 'Cole o trecho de código formatado e a explicação técnica...';
      case 'audio_memo':
        return 'Grave ou adicione uma nota de voz com reflexão calma...';
      case 'thought':
      default:
        return 'Compartilhe uma reflexão que respeite o tempo e a atenção de quem lê...';
    }
  }
}

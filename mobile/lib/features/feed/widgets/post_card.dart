import 'package:flutter/material.dart';
import '../../../core/models/post.dart';
import '../../../core/theme/app_theme.dart';

class PostCard extends StatelessWidget {
  final Post post;
  final Function(String reactionType)? onReact;
  final VoidCallback? onCommentTap;

  const PostCard({
    super.key,
    required this.post,
    this.onReact,
    this.onCommentTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          width: 1,
        ),
        boxShadow: isDark
            ? []
            : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Cabeçalho do Autor
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Image.network(
                  post.authorAvatar,
                  width: 40,
                  height: 40,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    width: 40,
                    height: 40,
                    color: AppColors.lilacPrimary,
                    child: Center(
                      child: Text(
                        post.authorName.isNotEmpty ? post.authorName[0] : '?',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      post.authorName,
                      style: TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      ),
                    ),
                    if (post.authorHeadline.isNotEmpty)
                      Text(
                        post.authorHeadline,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11.5,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // 2. Conteúdo do Post
          Text(
            post.content,
            style: TextStyle(
              fontSize: 14.5,
              height: 1.5,
              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
            ),
          ),

          // Mídia se houver
          if (post.mediaUrls.isNotEmpty) ...[
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.network(
                post.mediaUrls.first,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
          ],

          const SizedBox(height: 14),

          // 3. Barra de Interações (Reações, Respostas)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Botão Reagir
              GestureDetector(
                onTap: () {
                  _showReactionsBottomSheet(context);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkElevated : AppColors.lightElevated,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Text(
                        post.userReaction != null ? _getEmojiForReaction(post.userReaction!) : '❤️',
                        style: const TextStyle(fontSize: 14),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${post.reactionsCount}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Botão Respostas
              GestureDetector(
                onTap: onCommentTap,
                child: Row(
                  children: [
                    Icon(
                      Icons.chat_bubble_outline_rounded,
                      size: 16,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${post.responsesCount} respostas',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _getEmojiForReaction(String type) {
    switch (type) {
      case 'fire': return '🔥';
      case 'clap': return '👏';
      case 'lightbulb': return '💡';
      case 'handshake': return '🤝';
      case 'thinking': return '🤔';
      case 'heart':
      default: return '❤️';
    }
  }

  void _showReactionsBottomSheet(BuildContext context) {
    final reactions = [
      {'id': 'heart', 'emoji': '❤️', 'label': 'Curtir'},
      {'id': 'fire', 'emoji': '🔥', 'label': 'Fogo'},
      {'id': 'clap', 'emoji': '👏', 'label': 'Palmas'},
      {'id': 'lightbulb', 'emoji': '💡', 'label': 'Genial'},
      {'id': 'handshake', 'emoji': '🤝', 'label': 'Apoio'},
      {'id': 'thinking', 'emoji': '🤔', 'label': 'Reflexivo'},
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) {
        final isDark = Theme.of(context).brightness == Brightness.dark;

        return Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
            borderRadius: BorderRadius.circular(30),
            border: Border.all(
              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: reactions.map((r) {
              return GestureDetector(
                onTap: () {
                  Navigator.pop(context);
                  onReact?.call(r['id']!);
                },
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Text(
                    r['emoji']!,
                    style: const TextStyle(fontSize: 28),
                  ),
                ),
              );
            }).toList(),
          ),
        );
      },
    );
  }
}

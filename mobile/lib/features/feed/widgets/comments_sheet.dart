import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/theme/app_theme.dart';

class CommentModel {
  final String id;
  final String authorName;
  final String authorAvatar;
  final String authorHeadline;
  final String text;
  final String timeAgo;

  const CommentModel({
    required this.id,
    required this.authorName,
    required this.authorAvatar,
    required this.authorHeadline,
    required this.text,
    required this.timeAgo,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: json['id'] ?? '',
      authorName: json['author_name'] ?? 'Membro Consciente',
      authorAvatar: json['author_avatar'] ?? '',
      authorHeadline: json['author_username'] != null ? '@${json['author_username']}' : '',
      text: json['content'] ?? '',
      timeAgo: 'Recente',
    );
  }
}

class CommentsBottomSheet extends ConsumerStatefulWidget {
  final String postId;

  const CommentsBottomSheet({
    super.key,
    required this.postId,
  });

  @override
  ConsumerState<CommentsBottomSheet> createState() => _CommentsBottomSheetState();
}

class _CommentsBottomSheetState extends ConsumerState<CommentsBottomSheet> {
  final TextEditingController _controller = TextEditingController();
  final List<CommentModel> _comments = [];
  bool _isLoading = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadComments();
  }

  Future<void> _loadComments() async {
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final rawList = await api.getComments(widget.postId);
      
      final parsed = rawList.map((item) {
        if (item is Map<String, dynamic>) {
          return CommentModel.fromJson(item);
        }
        return CommentModel(
          id: item['id'] ?? '',
          authorName: item['author_name'] ?? 'Membro',
          authorAvatar: item['author_avatar'] ?? '',
          authorHeadline: '@${item['author_username'] ?? ''}',
          text: item['content'] ?? '',
          timeAgo: 'Recente',
        );
      }).toList();

      if (mounted) {
        setState(() {
          _comments.clear();
          _comments.addAll(parsed);
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _addComment() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isSubmitting) return;

    setState(() => _isSubmitting = true);
    final api = ref.read(apiServiceProvider);

    final res = await api.createComment(widget.postId, text);
    if (res != null && mounted) {
      setState(() {
        _comments.add(
          CommentModel(
            id: res['id'] ?? 'c-${DateTime.now().millisecondsSinceEpoch}',
            authorName: res['author_name'] ?? 'Você',
            authorAvatar: res['author_avatar'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            authorHeadline: 'Arquiteto de Sistemas',
            text: text,
            timeAgo: 'Agora',
          ),
        );
        _controller.clear();
        _isSubmitting = false;
      });
    } else if (mounted) {
      // Fallback local se estiver offline
      setState(() {
        _comments.add(
          CommentModel(
            id: 'c-${DateTime.now().millisecondsSinceEpoch}',
            authorName: 'Você',
            authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            authorHeadline: 'Arquiteto de Sistemas',
            text: text,
            timeAgo: 'Agora',
          ),
        );
        _controller.clear();
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          ),
        ),
      ),
      child: Column(
        children: [
          // Pílula Superior de Arrastar
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 38,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Título
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Respostas com Profundidade (${_comments.length})',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Lista de Comentários ou Estado Vazio
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.lilacPrimary),
                  )
                : _comments.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.chat_bubble_outline_rounded,
                              size: 40,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Nenhuma resposta reflexiva ainda.',
                              style: TextStyle(
                                fontSize: 14,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Seja o primeiro a enriquecer a conversa.',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _comments.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 14),
                        itemBuilder: (context, index) {
                          final c = _comments[index];

                          return Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkElevated : AppColors.lightElevated,
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 16,
                                      backgroundImage: c.authorAvatar.isNotEmpty
                                          ? NetworkImage(c.authorAvatar)
                                          : null,
                                      child: c.authorAvatar.isEmpty
                                          ? Text(c.authorName.isNotEmpty ? c.authorName[0] : 'U')
                                          : null,
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            c.authorName,
                                            style: const TextStyle(
                                              fontSize: 13.5,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          Text(
                                            c.authorHeadline,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(
                                              fontSize: 11,
                                              color: isDark
                                                  ? AppColors.darkTextSecondary
                                                  : AppColors.lightTextSecondary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      c.timeAgo,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: isDark
                                            ? AppColors.darkTextSecondary
                                            : AppColors.lightTextSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  c.text,
                                  style: TextStyle(
                                    fontSize: 13.5,
                                    height: 1.45,
                                    color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),

          // Input de Resposta
          SafeArea(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
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
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkElevated : AppColors.lightElevated,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: TextField(
                        controller: _controller,
                        style: const TextStyle(fontSize: 13.5),
                        decoration: const InputDecoration(
                          hintText: 'Escreva uma resposta reflexiva...',
                          border: InputBorder.none,
                          isDense: true,
                        ),
                        onSubmitted: (_) => _addComment(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _addComment,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.lilacPrimary,
                      ),
                      child: _isSubmitting
                          ? const Center(
                              child: SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              ),
                            )
                          : const Icon(
                              Icons.arrow_upward_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class ConversationModel {
  final String id;
  final String partnerName;
  final String partnerAvatar;
  final String lastMessage;
  final String timeAgo;
  final bool unread;
  final String? subject;

  const ConversationModel({
    required this.id,
    required this.partnerName,
    required this.partnerAvatar,
    required this.lastMessage,
    required this.timeAgo,
    this.unread = false,
    this.subject,
  });
}

class ConversationsScreen extends StatefulWidget {
  const ConversationsScreen({super.key});

  @override
  State<ConversationsScreen> createState() => _ConversationsScreenState();
}

class _ConversationsScreenState extends State<ConversationsScreen> {
  int _activeTab = 0; // 0 = Diretas, 1 = Solicitações

  final List<ConversationModel> _directs = const [
    ConversationModel(
      id: 'c-1',
      partnerName: 'Alice Liddell',
      partnerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      lastMessage: 'Li seu artigo sobre interfaces assíncronas. Achei fantástica a abordagem.',
      timeAgo: 'Há 15m',
      unread: true,
    ),
    ConversationModel(
      id: 'c-2',
      partnerName: 'Tomás Ramos',
      partnerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      lastMessage: 'Os componentes chegaram. Vamos ligar o analisador lógico amanhã.',
      timeAgo: 'Ontem',
    ),
  ];

  final List<ConversationModel> _requests = const [
    ConversationModel(
      id: 'c-3',
      partnerName: 'Lucas Barreto',
      partnerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      subject: 'Dúvida técnica sobre persistência em io_uring e integração no seu projeto de pesquisa aberta.',
      lastMessage: 'Olá Demóstenes, vi seu comentário na comunidade de Baixo Nível...',
      timeAgo: 'Há 1h',
      unread: true,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final items = _activeTab == 0 ? _directs : _requests;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mensagens Calmas'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_note_rounded),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          // Seletor de Abas
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () => setState(() => _activeTab = 0),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: _activeTab == 0 ? AppColors.lilacPrimary : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Diretas',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: _activeTab == 0
                            ? Colors.white
                            : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => setState(() => _activeTab = 1),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: _activeTab == 1 ? AppColors.lilacPrimary : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Text(
                          'Solicitações',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _activeTab == 1
                                ? Colors.white
                                : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                          ),
                        ),
                        if (_requests.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: _activeTab == 1 ? Colors.white24 : AppColors.lilacPrimary,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${_requests.length}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Lista de Conversas
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              physics: const BouncingScrollPhysics(),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final c = items[index];

                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundImage: NetworkImage(c.partnerAvatar),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  c.partnerName,
                                  style: TextStyle(
                                    fontSize: 14.5,
                                    fontWeight: c.unread ? FontWeight.bold : FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  c.timeAgo,
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                  ),
                                ),
                              ],
                            ),
                            if (c.subject != null) ...[
                              const SizedBox(height: 2),
                              Text(
                                'Assunto: ${c.subject}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.lilacPrimary,
                                ),
                              ),
                            ],
                            const SizedBox(height: 4),
                            Text(
                              c.lastMessage,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 13,
                                color: c.unread
                                    ? (isDark ? Colors.white : Colors.black)
                                    : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (c.unread)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(left: 8),
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.lilacPrimary,
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

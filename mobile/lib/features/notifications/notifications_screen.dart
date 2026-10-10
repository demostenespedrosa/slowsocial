import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class NotificationItem {
  final String id;
  final String actorName;
  final String actorAvatar;
  final String title;
  final String timeAgo;
  final String type; // reaction, comment, connection_request
  final String? emoji;
  final bool isRead;

  const NotificationItem({
    required this.id,
    required this.actorName,
    required this.actorAvatar,
    required this.title,
    required this.timeAgo,
    required this.type,
    this.emoji,
    this.isRead = false,
  });
}

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  final List<NotificationItem> _today = const [
    NotificationItem(
      id: 'n-1',
      actorName: 'Alice Liddell',
      actorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      title: 'reagiu ao seu momento com ❤️',
      timeAgo: 'Há 15m',
      type: 'reaction',
      emoji: '❤️',
    ),
    NotificationItem(
      id: 'n-2',
      actorName: 'Tomás Ramos',
      actorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      title: 'respondeu à sua publicação: "Os benchmarks de telemetria bateram perfeitamente..."',
      timeAgo: 'Há 1h',
      type: 'comment',
      isRead: true,
    ),
    NotificationItem(
      id: 'n-3',
      actorName: 'Lucas Barreto',
      actorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      title: 'enviou uma solicitação de contato com assunto técnico de 140 chars',
      timeAgo: 'Há 2h',
      type: 'connection_request',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notificações'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        physics: const BouncingScrollPhysics(),
        children: [
          Text(
            'HOJE',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.1,
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 12),
          ..._today.map((n) {
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundImage: NetworkImage(n.actorAvatar),
                      ),
                      if (n.emoji != null)
                        Positioned(
                          bottom: -2,
                          right: -2,
                          child: Container(
                            padding: const EdgeInsets.all(2),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkSurface : Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: Text(n.emoji!, style: const TextStyle(fontSize: 12)),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        RichText(
                          text: TextSpan(
                            style: TextStyle(
                              fontSize: 13.5,
                              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                            ),
                            children: [
                              TextSpan(
                                text: n.actorName,
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              const TextSpan(text: ' '),
                              TextSpan(text: n.title),
                            ],
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          n.timeAgo,
                          style: TextStyle(
                            fontSize: 11.5,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                        if (n.type == 'connection_request') ...[
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              ElevatedButton(
                                onPressed: () {},
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.lilacPrimary,
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                ),
                                child: const Text('Aceitar (1º grau)', style: TextStyle(fontSize: 12)),
                              ),
                              const SizedBox(width: 8),
                              OutlinedButton(
                                onPressed: () {},
                                style: OutlinedButton.styleFrom(
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                ),
                                child: const Text('Ignorar', style: TextStyle(fontSize: 12)),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

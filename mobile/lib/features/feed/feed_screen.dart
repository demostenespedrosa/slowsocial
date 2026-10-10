import 'package:flutter/material.dart';
import '../../core/models/momento.dart';
import '../../core/models/post.dart';
import '../../core/theme/app_theme.dart';
import '../momentos/widgets/momentos_bar.dart';
import 'widgets/post_card.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  int _activeTab = 0; // 0 = Conexões, 1 = Radar

  // Mock inicial para demonstração antes de conectar ao backend
  final List<AuthorMomentosGroup> _mockMomentos = [
    AuthorMomentosGroup(
      authorId: 'usr-alice',
      authorName: 'Alice Liddell',
      authorUsername: 'alice',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      hasUnviewed: true,
      stories: [
        MomentoStory(
          id: 'm-1',
          mediaUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
          textNote: 'Café da manhã revisando notas sobre ergonomia cognitiva sem nenhuma notificação aberta. O silêncio cura.',
          expiresInHours: 22,
          createdAt: DateTime.now().subtract(const Duration(hours: 2)),
        ),
        MomentoStory(
          id: 'm-2',
          textNote: '“A atenção é o recurso mais raro e precioso da era moderna. Não a negocie por estímulos descartáveis.”',
          expiresInHours: 23,
          createdAt: DateTime.now().subtract(const Duration(minutes: 45)),
        ),
      ],
    ),
    AuthorMomentosGroup(
      authorId: 'usr-tomas',
      authorName: 'Tomás Ramos',
      authorUsername: 'tomas',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      hasUnviewed: true,
      stories: [
        MomentoStory(
          id: 'm-3',
          mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
          textNote: 'Primeiro sinal limpo no osciloscópio do novo sensor. 18µA de consumo médio.',
          expiresInHours: 20,
          createdAt: DateTime.now().subtract(const Duration(hours: 4)),
        ),
      ],
    ),
    AuthorMomentosGroup(
      authorId: 'usr-mariana',
      authorName: 'Mariana Costa',
      authorUsername: 'mariana',
      authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      hasUnviewed: false,
      stories: [
        MomentoStory(
          id: 'm-4',
          mediaUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
          textNote: 'Luz matinal entrando no escritório. Um lembrete visual de que o trabalho não precisa ser caótico.',
          expiresInHours: 18,
          createdAt: DateTime.now().subtract(const Duration(hours: 6)),
        ),
      ],
    ),
  ];

  final List<Post> _mockPosts = [
    Post(
      id: 'p-1',
      authorId: 'usr-alice',
      authorName: 'Alice Liddell',
      authorUsername: 'alice',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      authorHeadline: 'Pesquisadora em Interação Humano-Computador & Ergonomia Cognitiva',
      content: 'A sobrecarga de estímulos na comunicação instantânea fragmenta nosso pensamento. Redes calmas e assíncronas restabelecem o fôlego necessário para a criatividade profunda.',
      reactionsCount: 24,
      responsesCount: 6,
      createdAt: DateTime.now().subtract(const Duration(hours: 3)),
    ),
    Post(
      id: 'p-2',
      authorId: 'usr-tomas',
      authorName: 'Tomás Ramos',
      authorUsername: 'tomas',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      authorHeadline: 'Engenheiro de Firmware & Hardware Aberto',
      content: 'Conseguimos reduzir o ruído na linha analógica da telemetria solar para zero alocações indesejadas no microcontrolador.',
      mediaUrls: [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
      ],
      reactionsCount: 18,
      responsesCount: 4,
      createdAt: DateTime.now().subtract(const Duration(hours: 5)),
    ),
  ];

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
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline_rounded),
            onPressed: () {},
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.delayed(const Duration(seconds: 1));
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          physics: const BouncingScrollPhysics(),
          children: [
            // 1. Barra de Momentos
            MomentosBar(
              groups: _mockMomentos,
              onAddMomento: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Abrir gravador de Momento')),
                );
              },
            ),

            // 2. Seletor de Abas (Conexões / Radar)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => setState(() => _activeTab = 0),
                    child: Text(
                      'Conexões',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: _activeTab == 0 ? FontWeight.bold : FontWeight.normal,
                        color: _activeTab == 0
                            ? (isDark ? Colors.white : Colors.black)
                            : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                      ),
                    ),
                  ),
                  const SizedBox(width: 24),
                  GestureDetector(
                    onTap: () => setState(() => _activeTab = 1),
                    child: Text(
                      'Radar',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: _activeTab == 1 ? FontWeight.bold : FontWeight.normal,
                        color: _activeTab == 1
                            ? (isDark ? Colors.white : Colors.black)
                            : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // 3. Lista de Posts
            ..._mockPosts.map((post) {
              return PostCard(
                post: post,
                onReact: (type) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Você reagiu com $type')),
                  );
                },
                onCommentTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Abrir comentários')),
                  );
                },
              );
            }),
          ],
        ),
      ),
    );
  }
}

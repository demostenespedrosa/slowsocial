import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/theme/app_theme.dart';

class ChatMessageModel {
  final String id;
  final String senderId;
  final String text;
  final DateTime time;
  final bool isMe;

  const ChatMessageModel({
    required this.id,
    required this.senderId,
    required this.text,
    required this.time,
    required this.isMe,
  });
}

class ChatRoomScreen extends ConsumerStatefulWidget {
  final String conversationId;
  final String partnerName;
  final String partnerAvatar;

  const ChatRoomScreen({
    super.key,
    required this.conversationId,
    required this.partnerName,
    required this.partnerAvatar,
  });

  @override
  ConsumerState<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends ConsumerState<ChatRoomScreen> {
  final TextEditingController _msgController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  final List<ChatMessageModel> _messages = [
    ChatMessageModel(
      id: 'm-1',
      senderId: 'partner',
      text: 'Olá Demóstenes! Li com atenção o seu artigo sobre interfaces assíncronas e redução de fadiga de contexto.',
      time: DateTime.now().subtract(const Duration(minutes: 20)),
      isMe: false,
    ),
    ChatMessageModel(
      id: 'm-2',
      senderId: 'me',
      text: 'Muito obrigado, Alice! A ideia era justamente propor que o design respeite a cognição humana em vez de disputar atenção a todo custo.',
      time: DateTime.now().subtract(const Duration(minutes: 15)),
      isMe: true,
    ),
    ChatMessageModel(
      id: 'm-3',
      senderId: 'partner',
      text: 'Concordo totalmente. Menos reuniões e mensagens fragmentadas geram reflexões muito mais profundas.',
      time: DateTime.now().subtract(const Duration(minutes: 10)),
      isMe: false,
    ),
  ];

  @override
  void dispose() {
    _msgController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() async {
    final text = _msgController.text.trim();
    if (text.isEmpty) return;

    final newMsg = ChatMessageModel(
      id: 'msg-${DateTime.now().millisecondsSinceEpoch}',
      senderId: 'me',
      text: text,
      time: DateTime.now(),
      isMe: true,
    );

    setState(() {
      _messages.add(newMsg);
      _msgController.clear();
    });

    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent + 80,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );

    // Enviar para o backend Go
    final api = ref.read(apiServiceProvider);
    await api.sendMessage(widget.conversationId, text);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundImage: NetworkImage(widget.partnerAvatar),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.partnerName,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  const Row(
                    children: [
                      Icon(Icons.circle, color: Color(0xFF30D158), size: 7),
                      SizedBox(width: 4),
                      Text(
                        'Online agora',
                        style: TextStyle(fontSize: 11, color: Color(0xFF30D158)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Mensagens
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];

                return Align(
                  alignment: msg.isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.78,
                    ),
                    decoration: BoxDecoration(
                      color: msg.isMe
                          ? (isDark ? AppColors.darkLilac : AppColors.lilacPrimary)
                          : (isDark ? AppColors.darkSurface : AppColors.lightSurface),
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(20),
                        topRight: const Radius.circular(20),
                        bottomLeft: Radius.circular(msg.isMe ? 20 : 4),
                        bottomRight: Radius.circular(msg.isMe ? 4 : 20),
                      ),
                      border: msg.isMe
                          ? null
                          : Border.all(
                              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                            ),
                    ),
                    child: Column(
                      crossAxisAlignment:
                          msg.isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                      children: [
                        Text(
                          msg.text,
                          style: TextStyle(
                            fontSize: 14.5,
                            height: 1.4,
                            color: msg.isMe
                                ? Colors.white
                                : (isDark
                                    ? AppColors.darkTextPrimary
                                    : AppColors.lightTextPrimary),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${msg.time.hour.toString().padLeft(2, '0')}:${msg.time.minute.toString().padLeft(2, '0')}',
                          style: TextStyle(
                            fontSize: 10,
                            color: msg.isMe
                                ? Colors.white70
                                : (isDark
                                    ? AppColors.darkTextSecondary
                                    : AppColors.lightTextSecondary),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Campo de Entrada na Base
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
              border: Border(
                top: BorderSide(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  width: 0.5,
                ),
              ),
            ),
            child: SafeArea(
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
                        controller: _msgController,
                        style: const TextStyle(fontSize: 14),
                        decoration: const InputDecoration(
                          hintText: 'Digite uma mensagem calma...',
                          border: InputBorder.none,
                          isDense: true,
                        ),
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _sendMessage,
                    child: Container(
                      width: 42,
                      height: 42,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [Color(0xFF7C65C1), Color(0xFFA390E4)],
                        ),
                      ),
                      child: const Icon(
                        Icons.send_rounded,
                        color: Colors.white,
                        size: 18,
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

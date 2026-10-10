import 'package:dio/dio.dart';
import '../models/momento.dart';
import '../models/post.dart';
import '../network/api_client.dart';

class ApiService {
  final ApiClient _apiClient;

  ApiService(this._apiClient);

  Dio get _dio => _apiClient.client;

  // 1. FEED & POSTS
  Future<List<Post>> getFeed({int limit = 15, int offset = 0}) async {
    try {
      final res = await _dio.get(
        '/feed',
        queryParameters: {'limit': limit, 'offset': offset},
      );
      if (res.data['success'] == true && res.data['data'] != null) {
        return (res.data['data'] as List)
            .map((item) => Post.fromJson(item))
            .toList();
      }
      return [];
    } catch (e) {
      // Retorna vazio ou erro controlado
      return [];
    }
  }

  Future<bool> createPost({
    required String content,
    String formatType = 'thought',
    List<String> mediaUrls = const [],
    String aspectRatio = '16:9',
  }) async {
    try {
      final res = await _dio.post('/posts', data: {
        'content': content,
        'format_type': formatType,
        'media_urls': mediaUrls,
        'aspect_ratio': aspectRatio,
      });
      return res.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  Future<bool> reactToPost(String postId, String reactionType) async {
    try {
      final res = await _dio.post(
        '/posts/$postId/react',
        data: {'reaction_type': reactionType},
      );
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // 2. MOMENTOS (STORIES 24H)
  Future<List<AuthorMomentosGroup>> getMomentos() async {
    try {
      final res = await _dio.get('/momentos');
      if (res.data['success'] == true && res.data['data'] != null) {
        return (res.data['data'] as List)
            .map((item) => AuthorMomentosGroup.fromJson(item))
            .toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<void> markMomentoViewed(String momentoId) async {
    try {
      await _dio.post('/momentos/$momentoId/view');
    } catch (_) {}
  }

  // 3. CONVERSAS & CHAT
  Future<List<dynamic>> getConversations({String tab = 'direct'}) async {
    try {
      final res = await _dio.get(
        '/conversations',
        queryParameters: {'tab': tab},
      );
      if (res.data['success'] == true && res.data['data'] != null) {
        return res.data['data'] as List;
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<bool> sendMessage(String conversationId, String content) async {
    try {
      final res = await _dio.post(
        '/conversations/$conversationId/messages',
        data: {'content': content},
      );
      return res.statusCode == 201;
    } catch (_) {
      return false;
    }
  }
}

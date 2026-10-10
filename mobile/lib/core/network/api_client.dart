import 'package:dio/dio.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ApiClient {
  late final Dio _dio;

  ApiClient({String baseUrl = 'https://api.papaleguasviagens.online/api/v1'}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ),
    );

    // Interceptor para injetar o JWT do Supabase Auth automaticamente
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final session = Supabase.instance.client.auth.currentSession;
          if (session != null) {
            options.headers['Authorization'] = 'Bearer ${session.accessToken}';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) {
          // Tratamento global de erros de rede
          return handler.next(error);
        },
      ),
    );
  }

  Dio get client => _dio;
}

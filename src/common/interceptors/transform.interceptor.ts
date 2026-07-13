import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse } from '../utils/api-response.util';

/**
 * Wraps every controller return value in { success, statusCode, message,
 * data, timestamp }. Controllers can return either a raw payload (wrapped
 * as-is) or { message, data, meta } to customize the message/pagination meta.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((result) => {
        const statusCode = response.statusCode;
        const isShaped =
          result && typeof result === 'object' && 'data' in result;

        return {
          success: true,
          statusCode,
          message: isShaped && result.message ? result.message : 'Success',
          data: isShaped ? result.data : result,
          ...(isShaped && result.meta ? { meta: result.meta } : {}),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

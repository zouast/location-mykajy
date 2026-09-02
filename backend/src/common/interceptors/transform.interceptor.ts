import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  statusCode: number;
  timestamp: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ResponseEnvelope<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T>> {
    const response = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data: T) => ({
        statusCode,
        timestamp: new Date().toISOString(),
        data,
      })),
    );
  }
}

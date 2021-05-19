import { Handler } from '@botol/tg-bot';
import { ContextTG } from '@botol/tg-bot';

export type MaybePromise<T> = Promise<T> | T;

export interface SessionStore<T> {
    get: (key: string) => MaybePromise<T | undefined>;
    set: (key: string, val: T) => MaybePromise<void>;
    delete: (key: string) => MaybePromise<void>;
}

export type ContextSessionInit<T> = { session?: T };
export type ContextSession<T> = { session: T };

export interface SessionOptions<T> {
    getKey?: (
        ctx: ContextTG,
    ) => Promise<string | undefined> | string | undefined;
    store?: SessionStore<T>;
    init: (ctx: ContextTG, key?: string) => MaybePromise<T>;
    update?: (ctx: ContextSession<T>, key?: string) => MaybePromise<void>;
}

export class MemorySession<T> implements SessionStore<Partial<T>> {
    private readonly store = new Map<string, { session: Partial<T> }>();

    get(key: string) {
        return this.store.get(key)?.session;
    }

    set(key: string, val: Partial<T>) {
        this.store.set(key, { session: val });
    }

    delete(key: string) {
        this.store.delete(key);
    }
}

export function defaultGetKey(ctx: ContextTG): string | undefined {
    let chatId = ctx.chat?.id;
    let fromId = ctx.from?.id;
    if (chatId == null || fromId == null) {
        return void 0;
    }
    return `${fromId}:${chatId}`;
}

export function BotolSession<T>(
    options?: SessionOptions<T>,
): Handler<Partial<ContextSession<T>> & ContextTG> {
    const getKey = options?.getKey ?? defaultGetKey;
    const store = options?.store ?? new MemorySession<T>();
    const init = options?.init ?? (() => ({}));
    const update =
        options?.update ??
        ((ctx, key) => {
            if (key != null) {
                store.set(key, ctx.session);
            }
        });
    return async (ctx, next) => {
        const key = await Promise.resolve(getKey(ctx));
        if (key == null) {
            (ctx as ContextSession<T>).session = await Promise.resolve(
                init(ctx, key) as T,
            );
            return next();
        }
        let session = await Promise.resolve(store.get(key));
        if (session == null) {
            (ctx as ContextSession<T>).session = await Promise.resolve(
                init(ctx, key) as T,
            );
        } else {
            (ctx as ContextSession<T>).session = session as T;
        }
        await next();
        await Promise.resolve(update(ctx as ContextSession<T>, key));
    };
}

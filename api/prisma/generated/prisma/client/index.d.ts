
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Ticket
 * 
 */
export type Ticket = $Result.DefaultSelection<Prisma.$TicketPayload>
/**
 * Model Message
 * 
 */
export type Message = $Result.DefaultSelection<Prisma.$MessagePayload>
/**
 * Model MessageSeen
 * 
 */
export type MessageSeen = $Result.DefaultSelection<Prisma.$MessageSeenPayload>
/**
 * Model Attachments
 * 
 */
export type Attachments = $Result.DefaultSelection<Prisma.$AttachmentsPayload>
/**
 * Model Notification
 * 
 */
export type Notification = $Result.DefaultSelection<Prisma.$NotificationPayload>
/**
 * Model NotificationRecipient
 * 
 */
export type NotificationRecipient = $Result.DefaultSelection<Prisma.$NotificationRecipientPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Role: {
  ADMIN: 'ADMIN',
  USER: 'USER',
  TECHNICAL_USER: 'TECHNICAL_USER'
};

export type Role = (typeof Role)[keyof typeof Role]


export const TicketStatus: {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
};

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus]

}

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

export type TicketStatus = $Enums.TicketStatus

export const TicketStatus: typeof $Enums.TicketStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.ticket`: Exposes CRUD operations for the **Ticket** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tickets
    * const tickets = await prisma.ticket.findMany()
    * ```
    */
  get ticket(): Prisma.TicketDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.message`: Exposes CRUD operations for the **Message** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Messages
    * const messages = await prisma.message.findMany()
    * ```
    */
  get message(): Prisma.MessageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.messageSeen`: Exposes CRUD operations for the **MessageSeen** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MessageSeens
    * const messageSeens = await prisma.messageSeen.findMany()
    * ```
    */
  get messageSeen(): Prisma.MessageSeenDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.attachments`: Exposes CRUD operations for the **Attachments** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Attachments
    * const attachments = await prisma.attachments.findMany()
    * ```
    */
  get attachments(): Prisma.AttachmentsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.notification`: Exposes CRUD operations for the **Notification** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Notifications
    * const notifications = await prisma.notification.findMany()
    * ```
    */
  get notification(): Prisma.NotificationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.notificationRecipient`: Exposes CRUD operations for the **NotificationRecipient** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more NotificationRecipients
    * const notificationRecipients = await prisma.notificationRecipient.findMany()
    * ```
    */
  get notificationRecipient(): Prisma.NotificationRecipientDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.7.0
   * Query Engine version: 3cff47a7f5d65c3ea74883f1d736e41d68ce91ed
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Ticket: 'Ticket',
    Message: 'Message',
    MessageSeen: 'MessageSeen',
    Attachments: 'Attachments',
    Notification: 'Notification',
    NotificationRecipient: 'NotificationRecipient'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "ticket" | "message" | "messageSeen" | "attachments" | "notification" | "notificationRecipient"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Ticket: {
        payload: Prisma.$TicketPayload<ExtArgs>
        fields: Prisma.TicketFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TicketFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TicketFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          findFirst: {
            args: Prisma.TicketFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TicketFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          findMany: {
            args: Prisma.TicketFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>[]
          }
          create: {
            args: Prisma.TicketCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          createMany: {
            args: Prisma.TicketCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.TicketDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          update: {
            args: Prisma.TicketUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          deleteMany: {
            args: Prisma.TicketDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TicketUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TicketUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TicketPayload>
          }
          aggregate: {
            args: Prisma.TicketAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTicket>
          }
          groupBy: {
            args: Prisma.TicketGroupByArgs<ExtArgs>
            result: $Utils.Optional<TicketGroupByOutputType>[]
          }
          count: {
            args: Prisma.TicketCountArgs<ExtArgs>
            result: $Utils.Optional<TicketCountAggregateOutputType> | number
          }
        }
      }
      Message: {
        payload: Prisma.$MessagePayload<ExtArgs>
        fields: Prisma.MessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findFirst: {
            args: Prisma.MessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findMany: {
            args: Prisma.MessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          create: {
            args: Prisma.MessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          createMany: {
            args: Prisma.MessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.MessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          update: {
            args: Prisma.MessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          deleteMany: {
            args: Prisma.MessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.MessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          aggregate: {
            args: Prisma.MessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMessage>
          }
          groupBy: {
            args: Prisma.MessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<MessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.MessageCountArgs<ExtArgs>
            result: $Utils.Optional<MessageCountAggregateOutputType> | number
          }
        }
      }
      MessageSeen: {
        payload: Prisma.$MessageSeenPayload<ExtArgs>
        fields: Prisma.MessageSeenFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MessageSeenFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageSeenPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MessageSeenFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageSeenPayload>
          }
          findFirst: {
            args: Prisma.MessageSeenFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageSeenPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MessageSeenFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageSeenPayload>
          }
          findMany: {
            args: Prisma.MessageSeenFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageSeenPayload>[]
          }
          create: {
            args: Prisma.MessageSeenCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageSeenPayload>
          }
          createMany: {
            args: Prisma.MessageSeenCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.MessageSeenDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageSeenPayload>
          }
          update: {
            args: Prisma.MessageSeenUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageSeenPayload>
          }
          deleteMany: {
            args: Prisma.MessageSeenDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MessageSeenUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.MessageSeenUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessageSeenPayload>
          }
          aggregate: {
            args: Prisma.MessageSeenAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMessageSeen>
          }
          groupBy: {
            args: Prisma.MessageSeenGroupByArgs<ExtArgs>
            result: $Utils.Optional<MessageSeenGroupByOutputType>[]
          }
          count: {
            args: Prisma.MessageSeenCountArgs<ExtArgs>
            result: $Utils.Optional<MessageSeenCountAggregateOutputType> | number
          }
        }
      }
      Attachments: {
        payload: Prisma.$AttachmentsPayload<ExtArgs>
        fields: Prisma.AttachmentsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AttachmentsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AttachmentsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentsPayload>
          }
          findFirst: {
            args: Prisma.AttachmentsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AttachmentsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentsPayload>
          }
          findMany: {
            args: Prisma.AttachmentsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentsPayload>[]
          }
          create: {
            args: Prisma.AttachmentsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentsPayload>
          }
          createMany: {
            args: Prisma.AttachmentsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.AttachmentsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentsPayload>
          }
          update: {
            args: Prisma.AttachmentsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentsPayload>
          }
          deleteMany: {
            args: Prisma.AttachmentsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AttachmentsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AttachmentsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AttachmentsPayload>
          }
          aggregate: {
            args: Prisma.AttachmentsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAttachments>
          }
          groupBy: {
            args: Prisma.AttachmentsGroupByArgs<ExtArgs>
            result: $Utils.Optional<AttachmentsGroupByOutputType>[]
          }
          count: {
            args: Prisma.AttachmentsCountArgs<ExtArgs>
            result: $Utils.Optional<AttachmentsCountAggregateOutputType> | number
          }
        }
      }
      Notification: {
        payload: Prisma.$NotificationPayload<ExtArgs>
        fields: Prisma.NotificationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NotificationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NotificationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          findFirst: {
            args: Prisma.NotificationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NotificationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          findMany: {
            args: Prisma.NotificationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>[]
          }
          create: {
            args: Prisma.NotificationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          createMany: {
            args: Prisma.NotificationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.NotificationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          update: {
            args: Prisma.NotificationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          deleteMany: {
            args: Prisma.NotificationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NotificationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.NotificationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          aggregate: {
            args: Prisma.NotificationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNotification>
          }
          groupBy: {
            args: Prisma.NotificationGroupByArgs<ExtArgs>
            result: $Utils.Optional<NotificationGroupByOutputType>[]
          }
          count: {
            args: Prisma.NotificationCountArgs<ExtArgs>
            result: $Utils.Optional<NotificationCountAggregateOutputType> | number
          }
        }
      }
      NotificationRecipient: {
        payload: Prisma.$NotificationRecipientPayload<ExtArgs>
        fields: Prisma.NotificationRecipientFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NotificationRecipientFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationRecipientPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NotificationRecipientFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationRecipientPayload>
          }
          findFirst: {
            args: Prisma.NotificationRecipientFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationRecipientPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NotificationRecipientFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationRecipientPayload>
          }
          findMany: {
            args: Prisma.NotificationRecipientFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationRecipientPayload>[]
          }
          create: {
            args: Prisma.NotificationRecipientCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationRecipientPayload>
          }
          createMany: {
            args: Prisma.NotificationRecipientCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.NotificationRecipientDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationRecipientPayload>
          }
          update: {
            args: Prisma.NotificationRecipientUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationRecipientPayload>
          }
          deleteMany: {
            args: Prisma.NotificationRecipientDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NotificationRecipientUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.NotificationRecipientUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationRecipientPayload>
          }
          aggregate: {
            args: Prisma.NotificationRecipientAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNotificationRecipient>
          }
          groupBy: {
            args: Prisma.NotificationRecipientGroupByArgs<ExtArgs>
            result: $Utils.Optional<NotificationRecipientGroupByOutputType>[]
          }
          count: {
            args: Prisma.NotificationRecipientCountArgs<ExtArgs>
            result: $Utils.Optional<NotificationRecipientCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    ticket?: TicketOmit
    message?: MessageOmit
    messageSeen?: MessageSeenOmit
    attachments?: AttachmentsOmit
    notification?: NotificationOmit
    notificationRecipient?: NotificationRecipientOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    createdTickets: number
    updatedTickets: number
    messages: number
    messageSeens: number
    sentNotifications: number
    notificationRecipients: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    createdTickets?: boolean | UserCountOutputTypeCountCreatedTicketsArgs
    updatedTickets?: boolean | UserCountOutputTypeCountUpdatedTicketsArgs
    messages?: boolean | UserCountOutputTypeCountMessagesArgs
    messageSeens?: boolean | UserCountOutputTypeCountMessageSeensArgs
    sentNotifications?: boolean | UserCountOutputTypeCountSentNotificationsArgs
    notificationRecipients?: boolean | UserCountOutputTypeCountNotificationRecipientsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCreatedTicketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountUpdatedTicketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountMessageSeensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageSeenWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSentNotificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountNotificationRecipientsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationRecipientWhereInput
  }


  /**
   * Count Type TicketCountOutputType
   */

  export type TicketCountOutputType = {
    messages: number
    notifications: number
  }

  export type TicketCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | TicketCountOutputTypeCountMessagesArgs
    notifications?: boolean | TicketCountOutputTypeCountNotificationsArgs
  }

  // Custom InputTypes
  /**
   * TicketCountOutputType without action
   */
  export type TicketCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TicketCountOutputType
     */
    select?: TicketCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TicketCountOutputType without action
   */
  export type TicketCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
  }

  /**
   * TicketCountOutputType without action
   */
  export type TicketCountOutputTypeCountNotificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
  }


  /**
   * Count Type MessageCountOutputType
   */

  export type MessageCountOutputType = {
    notification: number
    attachments: number
    seenBy: number
  }

  export type MessageCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    notification?: boolean | MessageCountOutputTypeCountNotificationArgs
    attachments?: boolean | MessageCountOutputTypeCountAttachmentsArgs
    seenBy?: boolean | MessageCountOutputTypeCountSeenByArgs
  }

  // Custom InputTypes
  /**
   * MessageCountOutputType without action
   */
  export type MessageCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageCountOutputType
     */
    select?: MessageCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * MessageCountOutputType without action
   */
  export type MessageCountOutputTypeCountNotificationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
  }

  /**
   * MessageCountOutputType without action
   */
  export type MessageCountOutputTypeCountAttachmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AttachmentsWhereInput
  }

  /**
   * MessageCountOutputType without action
   */
  export type MessageCountOutputTypeCountSeenByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageSeenWhereInput
  }


  /**
   * Count Type NotificationCountOutputType
   */

  export type NotificationCountOutputType = {
    recipients: number
  }

  export type NotificationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    recipients?: boolean | NotificationCountOutputTypeCountRecipientsArgs
  }

  // Custom InputTypes
  /**
   * NotificationCountOutputType without action
   */
  export type NotificationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationCountOutputType
     */
    select?: NotificationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * NotificationCountOutputType without action
   */
  export type NotificationCountOutputTypeCountRecipientsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationRecipientWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
  }

  export type UserMinAggregateOutputType = {
    id: number | null
    name: string | null
    phone: string | null
    password: string | null
    role: $Enums.Role | null
    lastLogin: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: number | null
    name: string | null
    phone: string | null
    password: string | null
    role: $Enums.Role | null
    lastLogin: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    name: number
    phone: number
    password: number
    role: number
    lastLogin: number
    createdAt: number
    updatedAt: number
    deletedAt: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    name?: true
    phone?: true
    password?: true
    role?: true
    lastLogin?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    name?: true
    phone?: true
    password?: true
    role?: true
    lastLogin?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    name?: true
    phone?: true
    password?: true
    role?: true
    lastLogin?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: number
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin: Date | null
    createdAt: Date
    updatedAt: Date | null
    deletedAt: Date | null
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    phone?: boolean
    password?: boolean
    role?: boolean
    lastLogin?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
    createdTickets?: boolean | User$createdTicketsArgs<ExtArgs>
    updatedTickets?: boolean | User$updatedTicketsArgs<ExtArgs>
    messages?: boolean | User$messagesArgs<ExtArgs>
    messageSeens?: boolean | User$messageSeensArgs<ExtArgs>
    sentNotifications?: boolean | User$sentNotificationsArgs<ExtArgs>
    notificationRecipients?: boolean | User$notificationRecipientsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>



  export type UserSelectScalar = {
    id?: boolean
    name?: boolean
    phone?: boolean
    password?: boolean
    role?: boolean
    lastLogin?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "phone" | "password" | "role" | "lastLogin" | "createdAt" | "updatedAt" | "deletedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    createdTickets?: boolean | User$createdTicketsArgs<ExtArgs>
    updatedTickets?: boolean | User$updatedTicketsArgs<ExtArgs>
    messages?: boolean | User$messagesArgs<ExtArgs>
    messageSeens?: boolean | User$messageSeensArgs<ExtArgs>
    sentNotifications?: boolean | User$sentNotificationsArgs<ExtArgs>
    notificationRecipients?: boolean | User$notificationRecipientsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      createdTickets: Prisma.$TicketPayload<ExtArgs>[]
      updatedTickets: Prisma.$TicketPayload<ExtArgs>[]
      messages: Prisma.$MessagePayload<ExtArgs>[]
      messageSeens: Prisma.$MessageSeenPayload<ExtArgs>[]
      sentNotifications: Prisma.$NotificationPayload<ExtArgs>[]
      notificationRecipients: Prisma.$NotificationRecipientPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      phone: string
      password: string
      role: $Enums.Role
      lastLogin: Date | null
      createdAt: Date
      updatedAt: Date | null
      deletedAt: Date | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    createdTickets<T extends User$createdTicketsArgs<ExtArgs> = {}>(args?: Subset<T, User$createdTicketsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    updatedTickets<T extends User$updatedTicketsArgs<ExtArgs> = {}>(args?: Subset<T, User$updatedTicketsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    messages<T extends User$messagesArgs<ExtArgs> = {}>(args?: Subset<T, User$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    messageSeens<T extends User$messageSeensArgs<ExtArgs> = {}>(args?: Subset<T, User$messageSeensArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessageSeenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    sentNotifications<T extends User$sentNotificationsArgs<ExtArgs> = {}>(args?: Subset<T, User$sentNotificationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    notificationRecipients<T extends User$notificationRecipientsArgs<ExtArgs> = {}>(args?: Subset<T, User$notificationRecipientsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationRecipientPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'Int'>
    readonly name: FieldRef<"User", 'String'>
    readonly phone: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'Role'>
    readonly lastLogin: FieldRef<"User", 'DateTime'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
    readonly deletedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.createdTickets
   */
  export type User$createdTicketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ticket
     */
    omit?: TicketOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    where?: TicketWhereInput
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    cursor?: TicketWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * User.updatedTickets
   */
  export type User$updatedTicketsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ticket
     */
    omit?: TicketOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    where?: TicketWhereInput
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    cursor?: TicketWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * User.messages
   */
  export type User$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    cursor?: MessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * User.messageSeens
   */
  export type User$messageSeensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageSeen
     */
    select?: MessageSeenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MessageSeen
     */
    omit?: MessageSeenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageSeenInclude<ExtArgs> | null
    where?: MessageSeenWhereInput
    orderBy?: MessageSeenOrderByWithRelationInput | MessageSeenOrderByWithRelationInput[]
    cursor?: MessageSeenWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageSeenScalarFieldEnum | MessageSeenScalarFieldEnum[]
  }

  /**
   * User.sentNotifications
   */
  export type User$sentNotificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    cursor?: NotificationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * User.notificationRecipients
   */
  export type User$notificationRecipientsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationRecipient
     */
    select?: NotificationRecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationRecipient
     */
    omit?: NotificationRecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationRecipientInclude<ExtArgs> | null
    where?: NotificationRecipientWhereInput
    orderBy?: NotificationRecipientOrderByWithRelationInput | NotificationRecipientOrderByWithRelationInput[]
    cursor?: NotificationRecipientWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NotificationRecipientScalarFieldEnum | NotificationRecipientScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Ticket
   */

  export type AggregateTicket = {
    _count: TicketCountAggregateOutputType | null
    _avg: TicketAvgAggregateOutputType | null
    _sum: TicketSumAggregateOutputType | null
    _min: TicketMinAggregateOutputType | null
    _max: TicketMaxAggregateOutputType | null
  }

  export type TicketAvgAggregateOutputType = {
    id: number | null
    createdBy: number | null
    updatedBy: number | null
  }

  export type TicketSumAggregateOutputType = {
    id: number | null
    createdBy: number | null
    updatedBy: number | null
  }

  export type TicketMinAggregateOutputType = {
    id: number | null
    ticketCode: string | null
    description: string | null
    customerName: string | null
    controllerNo: string | null
    head: string | null
    imei: string | null
    hp: string | null
    motorType: string | null
    state: string | null
    district: string | null
    village: string | null
    block: string | null
    complaintType: string | null
    faultCode: string | null
    status: $Enums.TicketStatus | null
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
  }

  export type TicketMaxAggregateOutputType = {
    id: number | null
    ticketCode: string | null
    description: string | null
    customerName: string | null
    controllerNo: string | null
    head: string | null
    imei: string | null
    hp: string | null
    motorType: string | null
    state: string | null
    district: string | null
    village: string | null
    block: string | null
    complaintType: string | null
    faultCode: string | null
    status: $Enums.TicketStatus | null
    createdBy: number | null
    updatedBy: number | null
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
  }

  export type TicketCountAggregateOutputType = {
    id: number
    ticketCode: number
    description: number
    customerName: number
    controllerNo: number
    head: number
    imei: number
    hp: number
    motorType: number
    state: number
    district: number
    village: number
    block: number
    complaintType: number
    faultCode: number
    status: number
    createdBy: number
    updatedBy: number
    createdAt: number
    updatedAt: number
    deletedAt: number
    _all: number
  }


  export type TicketAvgAggregateInputType = {
    id?: true
    createdBy?: true
    updatedBy?: true
  }

  export type TicketSumAggregateInputType = {
    id?: true
    createdBy?: true
    updatedBy?: true
  }

  export type TicketMinAggregateInputType = {
    id?: true
    ticketCode?: true
    description?: true
    customerName?: true
    controllerNo?: true
    head?: true
    imei?: true
    hp?: true
    motorType?: true
    state?: true
    district?: true
    village?: true
    block?: true
    complaintType?: true
    faultCode?: true
    status?: true
    createdBy?: true
    updatedBy?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
  }

  export type TicketMaxAggregateInputType = {
    id?: true
    ticketCode?: true
    description?: true
    customerName?: true
    controllerNo?: true
    head?: true
    imei?: true
    hp?: true
    motorType?: true
    state?: true
    district?: true
    village?: true
    block?: true
    complaintType?: true
    faultCode?: true
    status?: true
    createdBy?: true
    updatedBy?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
  }

  export type TicketCountAggregateInputType = {
    id?: true
    ticketCode?: true
    description?: true
    customerName?: true
    controllerNo?: true
    head?: true
    imei?: true
    hp?: true
    motorType?: true
    state?: true
    district?: true
    village?: true
    block?: true
    complaintType?: true
    faultCode?: true
    status?: true
    createdBy?: true
    updatedBy?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
    _all?: true
  }

  export type TicketAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Ticket to aggregate.
     */
    where?: TicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tickets to fetch.
     */
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tickets
    **/
    _count?: true | TicketCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TicketAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TicketSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TicketMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TicketMaxAggregateInputType
  }

  export type GetTicketAggregateType<T extends TicketAggregateArgs> = {
        [P in keyof T & keyof AggregateTicket]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTicket[P]>
      : GetScalarType<T[P], AggregateTicket[P]>
  }




  export type TicketGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TicketWhereInput
    orderBy?: TicketOrderByWithAggregationInput | TicketOrderByWithAggregationInput[]
    by: TicketScalarFieldEnum[] | TicketScalarFieldEnum
    having?: TicketScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TicketCountAggregateInputType | true
    _avg?: TicketAvgAggregateInputType
    _sum?: TicketSumAggregateInputType
    _min?: TicketMinAggregateInputType
    _max?: TicketMaxAggregateInputType
  }

  export type TicketGroupByOutputType = {
    id: number
    ticketCode: string
    description: string
    customerName: string
    controllerNo: string
    head: string | null
    imei: string | null
    hp: string | null
    motorType: string | null
    state: string
    district: string
    village: string | null
    block: string | null
    complaintType: string
    faultCode: string
    status: $Enums.TicketStatus
    createdBy: number
    updatedBy: number | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    _count: TicketCountAggregateOutputType | null
    _avg: TicketAvgAggregateOutputType | null
    _sum: TicketSumAggregateOutputType | null
    _min: TicketMinAggregateOutputType | null
    _max: TicketMaxAggregateOutputType | null
  }

  type GetTicketGroupByPayload<T extends TicketGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TicketGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TicketGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TicketGroupByOutputType[P]>
            : GetScalarType<T[P], TicketGroupByOutputType[P]>
        }
      >
    >


  export type TicketSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketCode?: boolean
    description?: boolean
    customerName?: boolean
    controllerNo?: boolean
    head?: boolean
    imei?: boolean
    hp?: boolean
    motorType?: boolean
    state?: boolean
    district?: boolean
    village?: boolean
    block?: boolean
    complaintType?: boolean
    faultCode?: boolean
    status?: boolean
    createdBy?: boolean
    updatedBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
    createdByUser?: boolean | UserDefaultArgs<ExtArgs>
    updatedByUser?: boolean | Ticket$updatedByUserArgs<ExtArgs>
    messages?: boolean | Ticket$messagesArgs<ExtArgs>
    notifications?: boolean | Ticket$notificationsArgs<ExtArgs>
    _count?: boolean | TicketCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ticket"]>



  export type TicketSelectScalar = {
    id?: boolean
    ticketCode?: boolean
    description?: boolean
    customerName?: boolean
    controllerNo?: boolean
    head?: boolean
    imei?: boolean
    hp?: boolean
    motorType?: boolean
    state?: boolean
    district?: boolean
    village?: boolean
    block?: boolean
    complaintType?: boolean
    faultCode?: boolean
    status?: boolean
    createdBy?: boolean
    updatedBy?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
  }

  export type TicketOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "ticketCode" | "description" | "customerName" | "controllerNo" | "head" | "imei" | "hp" | "motorType" | "state" | "district" | "village" | "block" | "complaintType" | "faultCode" | "status" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt" | "deletedAt", ExtArgs["result"]["ticket"]>
  export type TicketInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    createdByUser?: boolean | UserDefaultArgs<ExtArgs>
    updatedByUser?: boolean | Ticket$updatedByUserArgs<ExtArgs>
    messages?: boolean | Ticket$messagesArgs<ExtArgs>
    notifications?: boolean | Ticket$notificationsArgs<ExtArgs>
    _count?: boolean | TicketCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $TicketPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Ticket"
    objects: {
      createdByUser: Prisma.$UserPayload<ExtArgs>
      updatedByUser: Prisma.$UserPayload<ExtArgs> | null
      messages: Prisma.$MessagePayload<ExtArgs>[]
      notifications: Prisma.$NotificationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      ticketCode: string
      description: string
      customerName: string
      controllerNo: string
      head: string | null
      imei: string | null
      hp: string | null
      motorType: string | null
      state: string
      district: string
      village: string | null
      block: string | null
      complaintType: string
      faultCode: string
      status: $Enums.TicketStatus
      createdBy: number
      updatedBy: number | null
      createdAt: Date
      updatedAt: Date
      deletedAt: Date | null
    }, ExtArgs["result"]["ticket"]>
    composites: {}
  }

  type TicketGetPayload<S extends boolean | null | undefined | TicketDefaultArgs> = $Result.GetResult<Prisma.$TicketPayload, S>

  type TicketCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TicketFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TicketCountAggregateInputType | true
    }

  export interface TicketDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Ticket'], meta: { name: 'Ticket' } }
    /**
     * Find zero or one Ticket that matches the filter.
     * @param {TicketFindUniqueArgs} args - Arguments to find a Ticket
     * @example
     * // Get one Ticket
     * const ticket = await prisma.ticket.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TicketFindUniqueArgs>(args: SelectSubset<T, TicketFindUniqueArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Ticket that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TicketFindUniqueOrThrowArgs} args - Arguments to find a Ticket
     * @example
     * // Get one Ticket
     * const ticket = await prisma.ticket.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TicketFindUniqueOrThrowArgs>(args: SelectSubset<T, TicketFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Ticket that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketFindFirstArgs} args - Arguments to find a Ticket
     * @example
     * // Get one Ticket
     * const ticket = await prisma.ticket.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TicketFindFirstArgs>(args?: SelectSubset<T, TicketFindFirstArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Ticket that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketFindFirstOrThrowArgs} args - Arguments to find a Ticket
     * @example
     * // Get one Ticket
     * const ticket = await prisma.ticket.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TicketFindFirstOrThrowArgs>(args?: SelectSubset<T, TicketFindFirstOrThrowArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tickets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tickets
     * const tickets = await prisma.ticket.findMany()
     * 
     * // Get first 10 Tickets
     * const tickets = await prisma.ticket.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const ticketWithIdOnly = await prisma.ticket.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TicketFindManyArgs>(args?: SelectSubset<T, TicketFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Ticket.
     * @param {TicketCreateArgs} args - Arguments to create a Ticket.
     * @example
     * // Create one Ticket
     * const Ticket = await prisma.ticket.create({
     *   data: {
     *     // ... data to create a Ticket
     *   }
     * })
     * 
     */
    create<T extends TicketCreateArgs>(args: SelectSubset<T, TicketCreateArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tickets.
     * @param {TicketCreateManyArgs} args - Arguments to create many Tickets.
     * @example
     * // Create many Tickets
     * const ticket = await prisma.ticket.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TicketCreateManyArgs>(args?: SelectSubset<T, TicketCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Ticket.
     * @param {TicketDeleteArgs} args - Arguments to delete one Ticket.
     * @example
     * // Delete one Ticket
     * const Ticket = await prisma.ticket.delete({
     *   where: {
     *     // ... filter to delete one Ticket
     *   }
     * })
     * 
     */
    delete<T extends TicketDeleteArgs>(args: SelectSubset<T, TicketDeleteArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Ticket.
     * @param {TicketUpdateArgs} args - Arguments to update one Ticket.
     * @example
     * // Update one Ticket
     * const ticket = await prisma.ticket.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TicketUpdateArgs>(args: SelectSubset<T, TicketUpdateArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tickets.
     * @param {TicketDeleteManyArgs} args - Arguments to filter Tickets to delete.
     * @example
     * // Delete a few Tickets
     * const { count } = await prisma.ticket.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TicketDeleteManyArgs>(args?: SelectSubset<T, TicketDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tickets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tickets
     * const ticket = await prisma.ticket.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TicketUpdateManyArgs>(args: SelectSubset<T, TicketUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Ticket.
     * @param {TicketUpsertArgs} args - Arguments to update or create a Ticket.
     * @example
     * // Update or create a Ticket
     * const ticket = await prisma.ticket.upsert({
     *   create: {
     *     // ... data to create a Ticket
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Ticket we want to update
     *   }
     * })
     */
    upsert<T extends TicketUpsertArgs>(args: SelectSubset<T, TicketUpsertArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Tickets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketCountArgs} args - Arguments to filter Tickets to count.
     * @example
     * // Count the number of Tickets
     * const count = await prisma.ticket.count({
     *   where: {
     *     // ... the filter for the Tickets we want to count
     *   }
     * })
    **/
    count<T extends TicketCountArgs>(
      args?: Subset<T, TicketCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TicketCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Ticket.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TicketAggregateArgs>(args: Subset<T, TicketAggregateArgs>): Prisma.PrismaPromise<GetTicketAggregateType<T>>

    /**
     * Group by Ticket.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TicketGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TicketGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TicketGroupByArgs['orderBy'] }
        : { orderBy?: TicketGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TicketGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTicketGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Ticket model
   */
  readonly fields: TicketFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Ticket.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TicketClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    createdByUser<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    updatedByUser<T extends Ticket$updatedByUserArgs<ExtArgs> = {}>(args?: Subset<T, Ticket$updatedByUserArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    messages<T extends Ticket$messagesArgs<ExtArgs> = {}>(args?: Subset<T, Ticket$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    notifications<T extends Ticket$notificationsArgs<ExtArgs> = {}>(args?: Subset<T, Ticket$notificationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Ticket model
   */
  interface TicketFieldRefs {
    readonly id: FieldRef<"Ticket", 'Int'>
    readonly ticketCode: FieldRef<"Ticket", 'String'>
    readonly description: FieldRef<"Ticket", 'String'>
    readonly customerName: FieldRef<"Ticket", 'String'>
    readonly controllerNo: FieldRef<"Ticket", 'String'>
    readonly head: FieldRef<"Ticket", 'String'>
    readonly imei: FieldRef<"Ticket", 'String'>
    readonly hp: FieldRef<"Ticket", 'String'>
    readonly motorType: FieldRef<"Ticket", 'String'>
    readonly state: FieldRef<"Ticket", 'String'>
    readonly district: FieldRef<"Ticket", 'String'>
    readonly village: FieldRef<"Ticket", 'String'>
    readonly block: FieldRef<"Ticket", 'String'>
    readonly complaintType: FieldRef<"Ticket", 'String'>
    readonly faultCode: FieldRef<"Ticket", 'String'>
    readonly status: FieldRef<"Ticket", 'TicketStatus'>
    readonly createdBy: FieldRef<"Ticket", 'Int'>
    readonly updatedBy: FieldRef<"Ticket", 'Int'>
    readonly createdAt: FieldRef<"Ticket", 'DateTime'>
    readonly updatedAt: FieldRef<"Ticket", 'DateTime'>
    readonly deletedAt: FieldRef<"Ticket", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Ticket findUnique
   */
  export type TicketFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ticket
     */
    omit?: TicketOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Ticket to fetch.
     */
    where: TicketWhereUniqueInput
  }

  /**
   * Ticket findUniqueOrThrow
   */
  export type TicketFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ticket
     */
    omit?: TicketOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Ticket to fetch.
     */
    where: TicketWhereUniqueInput
  }

  /**
   * Ticket findFirst
   */
  export type TicketFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ticket
     */
    omit?: TicketOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Ticket to fetch.
     */
    where?: TicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tickets to fetch.
     */
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tickets.
     */
    cursor?: TicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tickets.
     */
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * Ticket findFirstOrThrow
   */
  export type TicketFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ticket
     */
    omit?: TicketOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Ticket to fetch.
     */
    where?: TicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tickets to fetch.
     */
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tickets.
     */
    cursor?: TicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tickets.
     */
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * Ticket findMany
   */
  export type TicketFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ticket
     */
    omit?: TicketOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter, which Tickets to fetch.
     */
    where?: TicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tickets to fetch.
     */
    orderBy?: TicketOrderByWithRelationInput | TicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tickets.
     */
    cursor?: TicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tickets.
     */
    skip?: number
    distinct?: TicketScalarFieldEnum | TicketScalarFieldEnum[]
  }

  /**
   * Ticket create
   */
  export type TicketCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ticket
     */
    omit?: TicketOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * The data needed to create a Ticket.
     */
    data: XOR<TicketCreateInput, TicketUncheckedCreateInput>
  }

  /**
   * Ticket createMany
   */
  export type TicketCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tickets.
     */
    data: TicketCreateManyInput | TicketCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Ticket update
   */
  export type TicketUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ticket
     */
    omit?: TicketOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * The data needed to update a Ticket.
     */
    data: XOR<TicketUpdateInput, TicketUncheckedUpdateInput>
    /**
     * Choose, which Ticket to update.
     */
    where: TicketWhereUniqueInput
  }

  /**
   * Ticket updateMany
   */
  export type TicketUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tickets.
     */
    data: XOR<TicketUpdateManyMutationInput, TicketUncheckedUpdateManyInput>
    /**
     * Filter which Tickets to update
     */
    where?: TicketWhereInput
    /**
     * Limit how many Tickets to update.
     */
    limit?: number
  }

  /**
   * Ticket upsert
   */
  export type TicketUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ticket
     */
    omit?: TicketOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * The filter to search for the Ticket to update in case it exists.
     */
    where: TicketWhereUniqueInput
    /**
     * In case the Ticket found by the `where` argument doesn't exist, create a new Ticket with this data.
     */
    create: XOR<TicketCreateInput, TicketUncheckedCreateInput>
    /**
     * In case the Ticket was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TicketUpdateInput, TicketUncheckedUpdateInput>
  }

  /**
   * Ticket delete
   */
  export type TicketDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ticket
     */
    omit?: TicketOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    /**
     * Filter which Ticket to delete.
     */
    where: TicketWhereUniqueInput
  }

  /**
   * Ticket deleteMany
   */
  export type TicketDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tickets to delete
     */
    where?: TicketWhereInput
    /**
     * Limit how many Tickets to delete.
     */
    limit?: number
  }

  /**
   * Ticket.updatedByUser
   */
  export type Ticket$updatedByUserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }

  /**
   * Ticket.messages
   */
  export type Ticket$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    cursor?: MessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Ticket.notifications
   */
  export type Ticket$notificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    cursor?: NotificationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Ticket without action
   */
  export type TicketDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ticket
     */
    omit?: TicketOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
  }


  /**
   * Model Message
   */

  export type AggregateMessage = {
    _count: MessageCountAggregateOutputType | null
    _avg: MessageAvgAggregateOutputType | null
    _sum: MessageSumAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  export type MessageAvgAggregateOutputType = {
    id: number | null
    senderId: number | null
    ticketId: number | null
  }

  export type MessageSumAggregateOutputType = {
    id: number | null
    senderId: number | null
    ticketId: number | null
  }

  export type MessageMinAggregateOutputType = {
    id: number | null
    content: string | null
    createdAt: Date | null
    senderId: number | null
    ticketId: number | null
  }

  export type MessageMaxAggregateOutputType = {
    id: number | null
    content: string | null
    createdAt: Date | null
    senderId: number | null
    ticketId: number | null
  }

  export type MessageCountAggregateOutputType = {
    id: number
    content: number
    createdAt: number
    senderId: number
    ticketId: number
    _all: number
  }


  export type MessageAvgAggregateInputType = {
    id?: true
    senderId?: true
    ticketId?: true
  }

  export type MessageSumAggregateInputType = {
    id?: true
    senderId?: true
    ticketId?: true
  }

  export type MessageMinAggregateInputType = {
    id?: true
    content?: true
    createdAt?: true
    senderId?: true
    ticketId?: true
  }

  export type MessageMaxAggregateInputType = {
    id?: true
    content?: true
    createdAt?: true
    senderId?: true
    ticketId?: true
  }

  export type MessageCountAggregateInputType = {
    id?: true
    content?: true
    createdAt?: true
    senderId?: true
    ticketId?: true
    _all?: true
  }

  export type MessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Message to aggregate.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Messages
    **/
    _count?: true | MessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MessageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MessageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MessageMaxAggregateInputType
  }

  export type GetMessageAggregateType<T extends MessageAggregateArgs> = {
        [P in keyof T & keyof AggregateMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMessage[P]>
      : GetScalarType<T[P], AggregateMessage[P]>
  }




  export type MessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithAggregationInput | MessageOrderByWithAggregationInput[]
    by: MessageScalarFieldEnum[] | MessageScalarFieldEnum
    having?: MessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MessageCountAggregateInputType | true
    _avg?: MessageAvgAggregateInputType
    _sum?: MessageSumAggregateInputType
    _min?: MessageMinAggregateInputType
    _max?: MessageMaxAggregateInputType
  }

  export type MessageGroupByOutputType = {
    id: number
    content: string
    createdAt: Date
    senderId: number
    ticketId: number
    _count: MessageCountAggregateOutputType | null
    _avg: MessageAvgAggregateOutputType | null
    _sum: MessageSumAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  type GetMessageGroupByPayload<T extends MessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MessageGroupByOutputType[P]>
            : GetScalarType<T[P], MessageGroupByOutputType[P]>
        }
      >
    >


  export type MessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    createdAt?: boolean
    senderId?: boolean
    ticketId?: boolean
    sender?: boolean | UserDefaultArgs<ExtArgs>
    ticket?: boolean | TicketDefaultArgs<ExtArgs>
    notification?: boolean | Message$notificationArgs<ExtArgs>
    attachments?: boolean | Message$attachmentsArgs<ExtArgs>
    seenBy?: boolean | Message$seenByArgs<ExtArgs>
    _count?: boolean | MessageCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>



  export type MessageSelectScalar = {
    id?: boolean
    content?: boolean
    createdAt?: boolean
    senderId?: boolean
    ticketId?: boolean
  }

  export type MessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "content" | "createdAt" | "senderId" | "ticketId", ExtArgs["result"]["message"]>
  export type MessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | UserDefaultArgs<ExtArgs>
    ticket?: boolean | TicketDefaultArgs<ExtArgs>
    notification?: boolean | Message$notificationArgs<ExtArgs>
    attachments?: boolean | Message$attachmentsArgs<ExtArgs>
    seenBy?: boolean | Message$seenByArgs<ExtArgs>
    _count?: boolean | MessageCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $MessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Message"
    objects: {
      sender: Prisma.$UserPayload<ExtArgs>
      ticket: Prisma.$TicketPayload<ExtArgs>
      notification: Prisma.$NotificationPayload<ExtArgs>[]
      attachments: Prisma.$AttachmentsPayload<ExtArgs>[]
      seenBy: Prisma.$MessageSeenPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      content: string
      createdAt: Date
      senderId: number
      ticketId: number
    }, ExtArgs["result"]["message"]>
    composites: {}
  }

  type MessageGetPayload<S extends boolean | null | undefined | MessageDefaultArgs> = $Result.GetResult<Prisma.$MessagePayload, S>

  type MessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MessageCountAggregateInputType | true
    }

  export interface MessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Message'], meta: { name: 'Message' } }
    /**
     * Find zero or one Message that matches the filter.
     * @param {MessageFindUniqueArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MessageFindUniqueArgs>(args: SelectSubset<T, MessageFindUniqueArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Message that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MessageFindUniqueOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MessageFindUniqueOrThrowArgs>(args: SelectSubset<T, MessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Message that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MessageFindFirstArgs>(args?: SelectSubset<T, MessageFindFirstArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Message that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MessageFindFirstOrThrowArgs>(args?: SelectSubset<T, MessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Messages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Messages
     * const messages = await prisma.message.findMany()
     * 
     * // Get first 10 Messages
     * const messages = await prisma.message.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const messageWithIdOnly = await prisma.message.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MessageFindManyArgs>(args?: SelectSubset<T, MessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Message.
     * @param {MessageCreateArgs} args - Arguments to create a Message.
     * @example
     * // Create one Message
     * const Message = await prisma.message.create({
     *   data: {
     *     // ... data to create a Message
     *   }
     * })
     * 
     */
    create<T extends MessageCreateArgs>(args: SelectSubset<T, MessageCreateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Messages.
     * @param {MessageCreateManyArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MessageCreateManyArgs>(args?: SelectSubset<T, MessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Message.
     * @param {MessageDeleteArgs} args - Arguments to delete one Message.
     * @example
     * // Delete one Message
     * const Message = await prisma.message.delete({
     *   where: {
     *     // ... filter to delete one Message
     *   }
     * })
     * 
     */
    delete<T extends MessageDeleteArgs>(args: SelectSubset<T, MessageDeleteArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Message.
     * @param {MessageUpdateArgs} args - Arguments to update one Message.
     * @example
     * // Update one Message
     * const message = await prisma.message.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MessageUpdateArgs>(args: SelectSubset<T, MessageUpdateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Messages.
     * @param {MessageDeleteManyArgs} args - Arguments to filter Messages to delete.
     * @example
     * // Delete a few Messages
     * const { count } = await prisma.message.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MessageDeleteManyArgs>(args?: SelectSubset<T, MessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Messages
     * const message = await prisma.message.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MessageUpdateManyArgs>(args: SelectSubset<T, MessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Message.
     * @param {MessageUpsertArgs} args - Arguments to update or create a Message.
     * @example
     * // Update or create a Message
     * const message = await prisma.message.upsert({
     *   create: {
     *     // ... data to create a Message
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Message we want to update
     *   }
     * })
     */
    upsert<T extends MessageUpsertArgs>(args: SelectSubset<T, MessageUpsertArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageCountArgs} args - Arguments to filter Messages to count.
     * @example
     * // Count the number of Messages
     * const count = await prisma.message.count({
     *   where: {
     *     // ... the filter for the Messages we want to count
     *   }
     * })
    **/
    count<T extends MessageCountArgs>(
      args?: Subset<T, MessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MessageAggregateArgs>(args: Subset<T, MessageAggregateArgs>): Prisma.PrismaPromise<GetMessageAggregateType<T>>

    /**
     * Group by Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MessageGroupByArgs['orderBy'] }
        : { orderBy?: MessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Message model
   */
  readonly fields: MessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Message.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sender<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    ticket<T extends TicketDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TicketDefaultArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    notification<T extends Message$notificationArgs<ExtArgs> = {}>(args?: Subset<T, Message$notificationArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    attachments<T extends Message$attachmentsArgs<ExtArgs> = {}>(args?: Subset<T, Message$attachmentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AttachmentsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    seenBy<T extends Message$seenByArgs<ExtArgs> = {}>(args?: Subset<T, Message$seenByArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessageSeenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Message model
   */
  interface MessageFieldRefs {
    readonly id: FieldRef<"Message", 'Int'>
    readonly content: FieldRef<"Message", 'String'>
    readonly createdAt: FieldRef<"Message", 'DateTime'>
    readonly senderId: FieldRef<"Message", 'Int'>
    readonly ticketId: FieldRef<"Message", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Message findUnique
   */
  export type MessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findUniqueOrThrow
   */
  export type MessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findFirst
   */
  export type MessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findFirstOrThrow
   */
  export type MessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findMany
   */
  export type MessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Messages to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message create
   */
  export type MessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to create a Message.
     */
    data: XOR<MessageCreateInput, MessageUncheckedCreateInput>
  }

  /**
   * Message createMany
   */
  export type MessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Message update
   */
  export type MessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to update a Message.
     */
    data: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
    /**
     * Choose, which Message to update.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message updateMany
   */
  export type MessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Messages.
     */
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
    /**
     * Filter which Messages to update
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to update.
     */
    limit?: number
  }

  /**
   * Message upsert
   */
  export type MessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The filter to search for the Message to update in case it exists.
     */
    where: MessageWhereUniqueInput
    /**
     * In case the Message found by the `where` argument doesn't exist, create a new Message with this data.
     */
    create: XOR<MessageCreateInput, MessageUncheckedCreateInput>
    /**
     * In case the Message was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
  }

  /**
   * Message delete
   */
  export type MessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter which Message to delete.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message deleteMany
   */
  export type MessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Messages to delete
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to delete.
     */
    limit?: number
  }

  /**
   * Message.notification
   */
  export type Message$notificationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    cursor?: NotificationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Message.attachments
   */
  export type Message$attachmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachments
     */
    select?: AttachmentsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachments
     */
    omit?: AttachmentsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentsInclude<ExtArgs> | null
    where?: AttachmentsWhereInput
    orderBy?: AttachmentsOrderByWithRelationInput | AttachmentsOrderByWithRelationInput[]
    cursor?: AttachmentsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AttachmentsScalarFieldEnum | AttachmentsScalarFieldEnum[]
  }

  /**
   * Message.seenBy
   */
  export type Message$seenByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageSeen
     */
    select?: MessageSeenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MessageSeen
     */
    omit?: MessageSeenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageSeenInclude<ExtArgs> | null
    where?: MessageSeenWhereInput
    orderBy?: MessageSeenOrderByWithRelationInput | MessageSeenOrderByWithRelationInput[]
    cursor?: MessageSeenWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageSeenScalarFieldEnum | MessageSeenScalarFieldEnum[]
  }

  /**
   * Message without action
   */
  export type MessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
  }


  /**
   * Model MessageSeen
   */

  export type AggregateMessageSeen = {
    _count: MessageSeenCountAggregateOutputType | null
    _avg: MessageSeenAvgAggregateOutputType | null
    _sum: MessageSeenSumAggregateOutputType | null
    _min: MessageSeenMinAggregateOutputType | null
    _max: MessageSeenMaxAggregateOutputType | null
  }

  export type MessageSeenAvgAggregateOutputType = {
    id: number | null
    messageId: number | null
    userId: number | null
  }

  export type MessageSeenSumAggregateOutputType = {
    id: number | null
    messageId: number | null
    userId: number | null
  }

  export type MessageSeenMinAggregateOutputType = {
    id: number | null
    seenAt: Date | null
    messageId: number | null
    userId: number | null
  }

  export type MessageSeenMaxAggregateOutputType = {
    id: number | null
    seenAt: Date | null
    messageId: number | null
    userId: number | null
  }

  export type MessageSeenCountAggregateOutputType = {
    id: number
    seenAt: number
    messageId: number
    userId: number
    _all: number
  }


  export type MessageSeenAvgAggregateInputType = {
    id?: true
    messageId?: true
    userId?: true
  }

  export type MessageSeenSumAggregateInputType = {
    id?: true
    messageId?: true
    userId?: true
  }

  export type MessageSeenMinAggregateInputType = {
    id?: true
    seenAt?: true
    messageId?: true
    userId?: true
  }

  export type MessageSeenMaxAggregateInputType = {
    id?: true
    seenAt?: true
    messageId?: true
    userId?: true
  }

  export type MessageSeenCountAggregateInputType = {
    id?: true
    seenAt?: true
    messageId?: true
    userId?: true
    _all?: true
  }

  export type MessageSeenAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MessageSeen to aggregate.
     */
    where?: MessageSeenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MessageSeens to fetch.
     */
    orderBy?: MessageSeenOrderByWithRelationInput | MessageSeenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MessageSeenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MessageSeens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MessageSeens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MessageSeens
    **/
    _count?: true | MessageSeenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MessageSeenAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MessageSeenSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MessageSeenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MessageSeenMaxAggregateInputType
  }

  export type GetMessageSeenAggregateType<T extends MessageSeenAggregateArgs> = {
        [P in keyof T & keyof AggregateMessageSeen]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMessageSeen[P]>
      : GetScalarType<T[P], AggregateMessageSeen[P]>
  }




  export type MessageSeenGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageSeenWhereInput
    orderBy?: MessageSeenOrderByWithAggregationInput | MessageSeenOrderByWithAggregationInput[]
    by: MessageSeenScalarFieldEnum[] | MessageSeenScalarFieldEnum
    having?: MessageSeenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MessageSeenCountAggregateInputType | true
    _avg?: MessageSeenAvgAggregateInputType
    _sum?: MessageSeenSumAggregateInputType
    _min?: MessageSeenMinAggregateInputType
    _max?: MessageSeenMaxAggregateInputType
  }

  export type MessageSeenGroupByOutputType = {
    id: number
    seenAt: Date
    messageId: number
    userId: number
    _count: MessageSeenCountAggregateOutputType | null
    _avg: MessageSeenAvgAggregateOutputType | null
    _sum: MessageSeenSumAggregateOutputType | null
    _min: MessageSeenMinAggregateOutputType | null
    _max: MessageSeenMaxAggregateOutputType | null
  }

  type GetMessageSeenGroupByPayload<T extends MessageSeenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MessageSeenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MessageSeenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MessageSeenGroupByOutputType[P]>
            : GetScalarType<T[P], MessageSeenGroupByOutputType[P]>
        }
      >
    >


  export type MessageSeenSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    seenAt?: boolean
    messageId?: boolean
    userId?: boolean
    message?: boolean | MessageDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["messageSeen"]>



  export type MessageSeenSelectScalar = {
    id?: boolean
    seenAt?: boolean
    messageId?: boolean
    userId?: boolean
  }

  export type MessageSeenOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "seenAt" | "messageId" | "userId", ExtArgs["result"]["messageSeen"]>
  export type MessageSeenInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    message?: boolean | MessageDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $MessageSeenPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MessageSeen"
    objects: {
      message: Prisma.$MessagePayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      seenAt: Date
      messageId: number
      userId: number
    }, ExtArgs["result"]["messageSeen"]>
    composites: {}
  }

  type MessageSeenGetPayload<S extends boolean | null | undefined | MessageSeenDefaultArgs> = $Result.GetResult<Prisma.$MessageSeenPayload, S>

  type MessageSeenCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MessageSeenFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MessageSeenCountAggregateInputType | true
    }

  export interface MessageSeenDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MessageSeen'], meta: { name: 'MessageSeen' } }
    /**
     * Find zero or one MessageSeen that matches the filter.
     * @param {MessageSeenFindUniqueArgs} args - Arguments to find a MessageSeen
     * @example
     * // Get one MessageSeen
     * const messageSeen = await prisma.messageSeen.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MessageSeenFindUniqueArgs>(args: SelectSubset<T, MessageSeenFindUniqueArgs<ExtArgs>>): Prisma__MessageSeenClient<$Result.GetResult<Prisma.$MessageSeenPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one MessageSeen that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MessageSeenFindUniqueOrThrowArgs} args - Arguments to find a MessageSeen
     * @example
     * // Get one MessageSeen
     * const messageSeen = await prisma.messageSeen.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MessageSeenFindUniqueOrThrowArgs>(args: SelectSubset<T, MessageSeenFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MessageSeenClient<$Result.GetResult<Prisma.$MessageSeenPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MessageSeen that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageSeenFindFirstArgs} args - Arguments to find a MessageSeen
     * @example
     * // Get one MessageSeen
     * const messageSeen = await prisma.messageSeen.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MessageSeenFindFirstArgs>(args?: SelectSubset<T, MessageSeenFindFirstArgs<ExtArgs>>): Prisma__MessageSeenClient<$Result.GetResult<Prisma.$MessageSeenPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first MessageSeen that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageSeenFindFirstOrThrowArgs} args - Arguments to find a MessageSeen
     * @example
     * // Get one MessageSeen
     * const messageSeen = await prisma.messageSeen.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MessageSeenFindFirstOrThrowArgs>(args?: SelectSubset<T, MessageSeenFindFirstOrThrowArgs<ExtArgs>>): Prisma__MessageSeenClient<$Result.GetResult<Prisma.$MessageSeenPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more MessageSeens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageSeenFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MessageSeens
     * const messageSeens = await prisma.messageSeen.findMany()
     * 
     * // Get first 10 MessageSeens
     * const messageSeens = await prisma.messageSeen.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const messageSeenWithIdOnly = await prisma.messageSeen.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MessageSeenFindManyArgs>(args?: SelectSubset<T, MessageSeenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessageSeenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a MessageSeen.
     * @param {MessageSeenCreateArgs} args - Arguments to create a MessageSeen.
     * @example
     * // Create one MessageSeen
     * const MessageSeen = await prisma.messageSeen.create({
     *   data: {
     *     // ... data to create a MessageSeen
     *   }
     * })
     * 
     */
    create<T extends MessageSeenCreateArgs>(args: SelectSubset<T, MessageSeenCreateArgs<ExtArgs>>): Prisma__MessageSeenClient<$Result.GetResult<Prisma.$MessageSeenPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many MessageSeens.
     * @param {MessageSeenCreateManyArgs} args - Arguments to create many MessageSeens.
     * @example
     * // Create many MessageSeens
     * const messageSeen = await prisma.messageSeen.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MessageSeenCreateManyArgs>(args?: SelectSubset<T, MessageSeenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a MessageSeen.
     * @param {MessageSeenDeleteArgs} args - Arguments to delete one MessageSeen.
     * @example
     * // Delete one MessageSeen
     * const MessageSeen = await prisma.messageSeen.delete({
     *   where: {
     *     // ... filter to delete one MessageSeen
     *   }
     * })
     * 
     */
    delete<T extends MessageSeenDeleteArgs>(args: SelectSubset<T, MessageSeenDeleteArgs<ExtArgs>>): Prisma__MessageSeenClient<$Result.GetResult<Prisma.$MessageSeenPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one MessageSeen.
     * @param {MessageSeenUpdateArgs} args - Arguments to update one MessageSeen.
     * @example
     * // Update one MessageSeen
     * const messageSeen = await prisma.messageSeen.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MessageSeenUpdateArgs>(args: SelectSubset<T, MessageSeenUpdateArgs<ExtArgs>>): Prisma__MessageSeenClient<$Result.GetResult<Prisma.$MessageSeenPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more MessageSeens.
     * @param {MessageSeenDeleteManyArgs} args - Arguments to filter MessageSeens to delete.
     * @example
     * // Delete a few MessageSeens
     * const { count } = await prisma.messageSeen.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MessageSeenDeleteManyArgs>(args?: SelectSubset<T, MessageSeenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MessageSeens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageSeenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MessageSeens
     * const messageSeen = await prisma.messageSeen.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MessageSeenUpdateManyArgs>(args: SelectSubset<T, MessageSeenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one MessageSeen.
     * @param {MessageSeenUpsertArgs} args - Arguments to update or create a MessageSeen.
     * @example
     * // Update or create a MessageSeen
     * const messageSeen = await prisma.messageSeen.upsert({
     *   create: {
     *     // ... data to create a MessageSeen
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MessageSeen we want to update
     *   }
     * })
     */
    upsert<T extends MessageSeenUpsertArgs>(args: SelectSubset<T, MessageSeenUpsertArgs<ExtArgs>>): Prisma__MessageSeenClient<$Result.GetResult<Prisma.$MessageSeenPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of MessageSeens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageSeenCountArgs} args - Arguments to filter MessageSeens to count.
     * @example
     * // Count the number of MessageSeens
     * const count = await prisma.messageSeen.count({
     *   where: {
     *     // ... the filter for the MessageSeens we want to count
     *   }
     * })
    **/
    count<T extends MessageSeenCountArgs>(
      args?: Subset<T, MessageSeenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MessageSeenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MessageSeen.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageSeenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MessageSeenAggregateArgs>(args: Subset<T, MessageSeenAggregateArgs>): Prisma.PrismaPromise<GetMessageSeenAggregateType<T>>

    /**
     * Group by MessageSeen.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageSeenGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MessageSeenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MessageSeenGroupByArgs['orderBy'] }
        : { orderBy?: MessageSeenGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MessageSeenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageSeenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MessageSeen model
   */
  readonly fields: MessageSeenFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MessageSeen.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MessageSeenClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    message<T extends MessageDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MessageDefaultArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MessageSeen model
   */
  interface MessageSeenFieldRefs {
    readonly id: FieldRef<"MessageSeen", 'Int'>
    readonly seenAt: FieldRef<"MessageSeen", 'DateTime'>
    readonly messageId: FieldRef<"MessageSeen", 'Int'>
    readonly userId: FieldRef<"MessageSeen", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * MessageSeen findUnique
   */
  export type MessageSeenFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageSeen
     */
    select?: MessageSeenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MessageSeen
     */
    omit?: MessageSeenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageSeenInclude<ExtArgs> | null
    /**
     * Filter, which MessageSeen to fetch.
     */
    where: MessageSeenWhereUniqueInput
  }

  /**
   * MessageSeen findUniqueOrThrow
   */
  export type MessageSeenFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageSeen
     */
    select?: MessageSeenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MessageSeen
     */
    omit?: MessageSeenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageSeenInclude<ExtArgs> | null
    /**
     * Filter, which MessageSeen to fetch.
     */
    where: MessageSeenWhereUniqueInput
  }

  /**
   * MessageSeen findFirst
   */
  export type MessageSeenFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageSeen
     */
    select?: MessageSeenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MessageSeen
     */
    omit?: MessageSeenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageSeenInclude<ExtArgs> | null
    /**
     * Filter, which MessageSeen to fetch.
     */
    where?: MessageSeenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MessageSeens to fetch.
     */
    orderBy?: MessageSeenOrderByWithRelationInput | MessageSeenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MessageSeens.
     */
    cursor?: MessageSeenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MessageSeens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MessageSeens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MessageSeens.
     */
    distinct?: MessageSeenScalarFieldEnum | MessageSeenScalarFieldEnum[]
  }

  /**
   * MessageSeen findFirstOrThrow
   */
  export type MessageSeenFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageSeen
     */
    select?: MessageSeenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MessageSeen
     */
    omit?: MessageSeenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageSeenInclude<ExtArgs> | null
    /**
     * Filter, which MessageSeen to fetch.
     */
    where?: MessageSeenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MessageSeens to fetch.
     */
    orderBy?: MessageSeenOrderByWithRelationInput | MessageSeenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MessageSeens.
     */
    cursor?: MessageSeenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MessageSeens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MessageSeens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MessageSeens.
     */
    distinct?: MessageSeenScalarFieldEnum | MessageSeenScalarFieldEnum[]
  }

  /**
   * MessageSeen findMany
   */
  export type MessageSeenFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageSeen
     */
    select?: MessageSeenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MessageSeen
     */
    omit?: MessageSeenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageSeenInclude<ExtArgs> | null
    /**
     * Filter, which MessageSeens to fetch.
     */
    where?: MessageSeenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MessageSeens to fetch.
     */
    orderBy?: MessageSeenOrderByWithRelationInput | MessageSeenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MessageSeens.
     */
    cursor?: MessageSeenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MessageSeens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MessageSeens.
     */
    skip?: number
    distinct?: MessageSeenScalarFieldEnum | MessageSeenScalarFieldEnum[]
  }

  /**
   * MessageSeen create
   */
  export type MessageSeenCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageSeen
     */
    select?: MessageSeenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MessageSeen
     */
    omit?: MessageSeenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageSeenInclude<ExtArgs> | null
    /**
     * The data needed to create a MessageSeen.
     */
    data: XOR<MessageSeenCreateInput, MessageSeenUncheckedCreateInput>
  }

  /**
   * MessageSeen createMany
   */
  export type MessageSeenCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MessageSeens.
     */
    data: MessageSeenCreateManyInput | MessageSeenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MessageSeen update
   */
  export type MessageSeenUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageSeen
     */
    select?: MessageSeenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MessageSeen
     */
    omit?: MessageSeenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageSeenInclude<ExtArgs> | null
    /**
     * The data needed to update a MessageSeen.
     */
    data: XOR<MessageSeenUpdateInput, MessageSeenUncheckedUpdateInput>
    /**
     * Choose, which MessageSeen to update.
     */
    where: MessageSeenWhereUniqueInput
  }

  /**
   * MessageSeen updateMany
   */
  export type MessageSeenUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MessageSeens.
     */
    data: XOR<MessageSeenUpdateManyMutationInput, MessageSeenUncheckedUpdateManyInput>
    /**
     * Filter which MessageSeens to update
     */
    where?: MessageSeenWhereInput
    /**
     * Limit how many MessageSeens to update.
     */
    limit?: number
  }

  /**
   * MessageSeen upsert
   */
  export type MessageSeenUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageSeen
     */
    select?: MessageSeenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MessageSeen
     */
    omit?: MessageSeenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageSeenInclude<ExtArgs> | null
    /**
     * The filter to search for the MessageSeen to update in case it exists.
     */
    where: MessageSeenWhereUniqueInput
    /**
     * In case the MessageSeen found by the `where` argument doesn't exist, create a new MessageSeen with this data.
     */
    create: XOR<MessageSeenCreateInput, MessageSeenUncheckedCreateInput>
    /**
     * In case the MessageSeen was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MessageSeenUpdateInput, MessageSeenUncheckedUpdateInput>
  }

  /**
   * MessageSeen delete
   */
  export type MessageSeenDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageSeen
     */
    select?: MessageSeenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MessageSeen
     */
    omit?: MessageSeenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageSeenInclude<ExtArgs> | null
    /**
     * Filter which MessageSeen to delete.
     */
    where: MessageSeenWhereUniqueInput
  }

  /**
   * MessageSeen deleteMany
   */
  export type MessageSeenDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MessageSeens to delete
     */
    where?: MessageSeenWhereInput
    /**
     * Limit how many MessageSeens to delete.
     */
    limit?: number
  }

  /**
   * MessageSeen without action
   */
  export type MessageSeenDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MessageSeen
     */
    select?: MessageSeenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the MessageSeen
     */
    omit?: MessageSeenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageSeenInclude<ExtArgs> | null
  }


  /**
   * Model Attachments
   */

  export type AggregateAttachments = {
    _count: AttachmentsCountAggregateOutputType | null
    _avg: AttachmentsAvgAggregateOutputType | null
    _sum: AttachmentsSumAggregateOutputType | null
    _min: AttachmentsMinAggregateOutputType | null
    _max: AttachmentsMaxAggregateOutputType | null
  }

  export type AttachmentsAvgAggregateOutputType = {
    id: number | null
    fileSize: number | null
    messageId: number | null
  }

  export type AttachmentsSumAggregateOutputType = {
    id: number | null
    fileSize: number | null
    messageId: number | null
  }

  export type AttachmentsMinAggregateOutputType = {
    id: number | null
    fileName: string | null
    fileType: string | null
    fileSize: number | null
    fileUrl: string | null
    createdAt: Date | null
    messageId: number | null
  }

  export type AttachmentsMaxAggregateOutputType = {
    id: number | null
    fileName: string | null
    fileType: string | null
    fileSize: number | null
    fileUrl: string | null
    createdAt: Date | null
    messageId: number | null
  }

  export type AttachmentsCountAggregateOutputType = {
    id: number
    fileName: number
    fileType: number
    fileSize: number
    fileUrl: number
    createdAt: number
    messageId: number
    _all: number
  }


  export type AttachmentsAvgAggregateInputType = {
    id?: true
    fileSize?: true
    messageId?: true
  }

  export type AttachmentsSumAggregateInputType = {
    id?: true
    fileSize?: true
    messageId?: true
  }

  export type AttachmentsMinAggregateInputType = {
    id?: true
    fileName?: true
    fileType?: true
    fileSize?: true
    fileUrl?: true
    createdAt?: true
    messageId?: true
  }

  export type AttachmentsMaxAggregateInputType = {
    id?: true
    fileName?: true
    fileType?: true
    fileSize?: true
    fileUrl?: true
    createdAt?: true
    messageId?: true
  }

  export type AttachmentsCountAggregateInputType = {
    id?: true
    fileName?: true
    fileType?: true
    fileSize?: true
    fileUrl?: true
    createdAt?: true
    messageId?: true
    _all?: true
  }

  export type AttachmentsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Attachments to aggregate.
     */
    where?: AttachmentsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Attachments to fetch.
     */
    orderBy?: AttachmentsOrderByWithRelationInput | AttachmentsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AttachmentsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Attachments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Attachments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Attachments
    **/
    _count?: true | AttachmentsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AttachmentsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AttachmentsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AttachmentsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AttachmentsMaxAggregateInputType
  }

  export type GetAttachmentsAggregateType<T extends AttachmentsAggregateArgs> = {
        [P in keyof T & keyof AggregateAttachments]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAttachments[P]>
      : GetScalarType<T[P], AggregateAttachments[P]>
  }




  export type AttachmentsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AttachmentsWhereInput
    orderBy?: AttachmentsOrderByWithAggregationInput | AttachmentsOrderByWithAggregationInput[]
    by: AttachmentsScalarFieldEnum[] | AttachmentsScalarFieldEnum
    having?: AttachmentsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AttachmentsCountAggregateInputType | true
    _avg?: AttachmentsAvgAggregateInputType
    _sum?: AttachmentsSumAggregateInputType
    _min?: AttachmentsMinAggregateInputType
    _max?: AttachmentsMaxAggregateInputType
  }

  export type AttachmentsGroupByOutputType = {
    id: number
    fileName: string
    fileType: string
    fileSize: number
    fileUrl: string
    createdAt: Date
    messageId: number
    _count: AttachmentsCountAggregateOutputType | null
    _avg: AttachmentsAvgAggregateOutputType | null
    _sum: AttachmentsSumAggregateOutputType | null
    _min: AttachmentsMinAggregateOutputType | null
    _max: AttachmentsMaxAggregateOutputType | null
  }

  type GetAttachmentsGroupByPayload<T extends AttachmentsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AttachmentsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AttachmentsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AttachmentsGroupByOutputType[P]>
            : GetScalarType<T[P], AttachmentsGroupByOutputType[P]>
        }
      >
    >


  export type AttachmentsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fileName?: boolean
    fileType?: boolean
    fileSize?: boolean
    fileUrl?: boolean
    createdAt?: boolean
    messageId?: boolean
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["attachments"]>



  export type AttachmentsSelectScalar = {
    id?: boolean
    fileName?: boolean
    fileType?: boolean
    fileSize?: boolean
    fileUrl?: boolean
    createdAt?: boolean
    messageId?: boolean
  }

  export type AttachmentsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "fileName" | "fileType" | "fileSize" | "fileUrl" | "createdAt" | "messageId", ExtArgs["result"]["attachments"]>
  export type AttachmentsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    message?: boolean | MessageDefaultArgs<ExtArgs>
  }

  export type $AttachmentsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Attachments"
    objects: {
      message: Prisma.$MessagePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      fileName: string
      fileType: string
      fileSize: number
      fileUrl: string
      createdAt: Date
      messageId: number
    }, ExtArgs["result"]["attachments"]>
    composites: {}
  }

  type AttachmentsGetPayload<S extends boolean | null | undefined | AttachmentsDefaultArgs> = $Result.GetResult<Prisma.$AttachmentsPayload, S>

  type AttachmentsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AttachmentsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AttachmentsCountAggregateInputType | true
    }

  export interface AttachmentsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Attachments'], meta: { name: 'Attachments' } }
    /**
     * Find zero or one Attachments that matches the filter.
     * @param {AttachmentsFindUniqueArgs} args - Arguments to find a Attachments
     * @example
     * // Get one Attachments
     * const attachments = await prisma.attachments.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AttachmentsFindUniqueArgs>(args: SelectSubset<T, AttachmentsFindUniqueArgs<ExtArgs>>): Prisma__AttachmentsClient<$Result.GetResult<Prisma.$AttachmentsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Attachments that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AttachmentsFindUniqueOrThrowArgs} args - Arguments to find a Attachments
     * @example
     * // Get one Attachments
     * const attachments = await prisma.attachments.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AttachmentsFindUniqueOrThrowArgs>(args: SelectSubset<T, AttachmentsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AttachmentsClient<$Result.GetResult<Prisma.$AttachmentsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Attachments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AttachmentsFindFirstArgs} args - Arguments to find a Attachments
     * @example
     * // Get one Attachments
     * const attachments = await prisma.attachments.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AttachmentsFindFirstArgs>(args?: SelectSubset<T, AttachmentsFindFirstArgs<ExtArgs>>): Prisma__AttachmentsClient<$Result.GetResult<Prisma.$AttachmentsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Attachments that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AttachmentsFindFirstOrThrowArgs} args - Arguments to find a Attachments
     * @example
     * // Get one Attachments
     * const attachments = await prisma.attachments.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AttachmentsFindFirstOrThrowArgs>(args?: SelectSubset<T, AttachmentsFindFirstOrThrowArgs<ExtArgs>>): Prisma__AttachmentsClient<$Result.GetResult<Prisma.$AttachmentsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Attachments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AttachmentsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Attachments
     * const attachments = await prisma.attachments.findMany()
     * 
     * // Get first 10 Attachments
     * const attachments = await prisma.attachments.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const attachmentsWithIdOnly = await prisma.attachments.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AttachmentsFindManyArgs>(args?: SelectSubset<T, AttachmentsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AttachmentsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Attachments.
     * @param {AttachmentsCreateArgs} args - Arguments to create a Attachments.
     * @example
     * // Create one Attachments
     * const Attachments = await prisma.attachments.create({
     *   data: {
     *     // ... data to create a Attachments
     *   }
     * })
     * 
     */
    create<T extends AttachmentsCreateArgs>(args: SelectSubset<T, AttachmentsCreateArgs<ExtArgs>>): Prisma__AttachmentsClient<$Result.GetResult<Prisma.$AttachmentsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Attachments.
     * @param {AttachmentsCreateManyArgs} args - Arguments to create many Attachments.
     * @example
     * // Create many Attachments
     * const attachments = await prisma.attachments.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AttachmentsCreateManyArgs>(args?: SelectSubset<T, AttachmentsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Attachments.
     * @param {AttachmentsDeleteArgs} args - Arguments to delete one Attachments.
     * @example
     * // Delete one Attachments
     * const Attachments = await prisma.attachments.delete({
     *   where: {
     *     // ... filter to delete one Attachments
     *   }
     * })
     * 
     */
    delete<T extends AttachmentsDeleteArgs>(args: SelectSubset<T, AttachmentsDeleteArgs<ExtArgs>>): Prisma__AttachmentsClient<$Result.GetResult<Prisma.$AttachmentsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Attachments.
     * @param {AttachmentsUpdateArgs} args - Arguments to update one Attachments.
     * @example
     * // Update one Attachments
     * const attachments = await prisma.attachments.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AttachmentsUpdateArgs>(args: SelectSubset<T, AttachmentsUpdateArgs<ExtArgs>>): Prisma__AttachmentsClient<$Result.GetResult<Prisma.$AttachmentsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Attachments.
     * @param {AttachmentsDeleteManyArgs} args - Arguments to filter Attachments to delete.
     * @example
     * // Delete a few Attachments
     * const { count } = await prisma.attachments.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AttachmentsDeleteManyArgs>(args?: SelectSubset<T, AttachmentsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Attachments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AttachmentsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Attachments
     * const attachments = await prisma.attachments.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AttachmentsUpdateManyArgs>(args: SelectSubset<T, AttachmentsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Attachments.
     * @param {AttachmentsUpsertArgs} args - Arguments to update or create a Attachments.
     * @example
     * // Update or create a Attachments
     * const attachments = await prisma.attachments.upsert({
     *   create: {
     *     // ... data to create a Attachments
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Attachments we want to update
     *   }
     * })
     */
    upsert<T extends AttachmentsUpsertArgs>(args: SelectSubset<T, AttachmentsUpsertArgs<ExtArgs>>): Prisma__AttachmentsClient<$Result.GetResult<Prisma.$AttachmentsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Attachments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AttachmentsCountArgs} args - Arguments to filter Attachments to count.
     * @example
     * // Count the number of Attachments
     * const count = await prisma.attachments.count({
     *   where: {
     *     // ... the filter for the Attachments we want to count
     *   }
     * })
    **/
    count<T extends AttachmentsCountArgs>(
      args?: Subset<T, AttachmentsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AttachmentsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Attachments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AttachmentsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AttachmentsAggregateArgs>(args: Subset<T, AttachmentsAggregateArgs>): Prisma.PrismaPromise<GetAttachmentsAggregateType<T>>

    /**
     * Group by Attachments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AttachmentsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AttachmentsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AttachmentsGroupByArgs['orderBy'] }
        : { orderBy?: AttachmentsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AttachmentsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAttachmentsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Attachments model
   */
  readonly fields: AttachmentsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Attachments.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AttachmentsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    message<T extends MessageDefaultArgs<ExtArgs> = {}>(args?: Subset<T, MessageDefaultArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Attachments model
   */
  interface AttachmentsFieldRefs {
    readonly id: FieldRef<"Attachments", 'Int'>
    readonly fileName: FieldRef<"Attachments", 'String'>
    readonly fileType: FieldRef<"Attachments", 'String'>
    readonly fileSize: FieldRef<"Attachments", 'Int'>
    readonly fileUrl: FieldRef<"Attachments", 'String'>
    readonly createdAt: FieldRef<"Attachments", 'DateTime'>
    readonly messageId: FieldRef<"Attachments", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Attachments findUnique
   */
  export type AttachmentsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachments
     */
    select?: AttachmentsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachments
     */
    omit?: AttachmentsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentsInclude<ExtArgs> | null
    /**
     * Filter, which Attachments to fetch.
     */
    where: AttachmentsWhereUniqueInput
  }

  /**
   * Attachments findUniqueOrThrow
   */
  export type AttachmentsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachments
     */
    select?: AttachmentsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachments
     */
    omit?: AttachmentsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentsInclude<ExtArgs> | null
    /**
     * Filter, which Attachments to fetch.
     */
    where: AttachmentsWhereUniqueInput
  }

  /**
   * Attachments findFirst
   */
  export type AttachmentsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachments
     */
    select?: AttachmentsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachments
     */
    omit?: AttachmentsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentsInclude<ExtArgs> | null
    /**
     * Filter, which Attachments to fetch.
     */
    where?: AttachmentsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Attachments to fetch.
     */
    orderBy?: AttachmentsOrderByWithRelationInput | AttachmentsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Attachments.
     */
    cursor?: AttachmentsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Attachments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Attachments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Attachments.
     */
    distinct?: AttachmentsScalarFieldEnum | AttachmentsScalarFieldEnum[]
  }

  /**
   * Attachments findFirstOrThrow
   */
  export type AttachmentsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachments
     */
    select?: AttachmentsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachments
     */
    omit?: AttachmentsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentsInclude<ExtArgs> | null
    /**
     * Filter, which Attachments to fetch.
     */
    where?: AttachmentsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Attachments to fetch.
     */
    orderBy?: AttachmentsOrderByWithRelationInput | AttachmentsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Attachments.
     */
    cursor?: AttachmentsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Attachments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Attachments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Attachments.
     */
    distinct?: AttachmentsScalarFieldEnum | AttachmentsScalarFieldEnum[]
  }

  /**
   * Attachments findMany
   */
  export type AttachmentsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachments
     */
    select?: AttachmentsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachments
     */
    omit?: AttachmentsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentsInclude<ExtArgs> | null
    /**
     * Filter, which Attachments to fetch.
     */
    where?: AttachmentsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Attachments to fetch.
     */
    orderBy?: AttachmentsOrderByWithRelationInput | AttachmentsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Attachments.
     */
    cursor?: AttachmentsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Attachments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Attachments.
     */
    skip?: number
    distinct?: AttachmentsScalarFieldEnum | AttachmentsScalarFieldEnum[]
  }

  /**
   * Attachments create
   */
  export type AttachmentsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachments
     */
    select?: AttachmentsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachments
     */
    omit?: AttachmentsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentsInclude<ExtArgs> | null
    /**
     * The data needed to create a Attachments.
     */
    data: XOR<AttachmentsCreateInput, AttachmentsUncheckedCreateInput>
  }

  /**
   * Attachments createMany
   */
  export type AttachmentsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Attachments.
     */
    data: AttachmentsCreateManyInput | AttachmentsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Attachments update
   */
  export type AttachmentsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachments
     */
    select?: AttachmentsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachments
     */
    omit?: AttachmentsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentsInclude<ExtArgs> | null
    /**
     * The data needed to update a Attachments.
     */
    data: XOR<AttachmentsUpdateInput, AttachmentsUncheckedUpdateInput>
    /**
     * Choose, which Attachments to update.
     */
    where: AttachmentsWhereUniqueInput
  }

  /**
   * Attachments updateMany
   */
  export type AttachmentsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Attachments.
     */
    data: XOR<AttachmentsUpdateManyMutationInput, AttachmentsUncheckedUpdateManyInput>
    /**
     * Filter which Attachments to update
     */
    where?: AttachmentsWhereInput
    /**
     * Limit how many Attachments to update.
     */
    limit?: number
  }

  /**
   * Attachments upsert
   */
  export type AttachmentsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachments
     */
    select?: AttachmentsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachments
     */
    omit?: AttachmentsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentsInclude<ExtArgs> | null
    /**
     * The filter to search for the Attachments to update in case it exists.
     */
    where: AttachmentsWhereUniqueInput
    /**
     * In case the Attachments found by the `where` argument doesn't exist, create a new Attachments with this data.
     */
    create: XOR<AttachmentsCreateInput, AttachmentsUncheckedCreateInput>
    /**
     * In case the Attachments was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AttachmentsUpdateInput, AttachmentsUncheckedUpdateInput>
  }

  /**
   * Attachments delete
   */
  export type AttachmentsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachments
     */
    select?: AttachmentsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachments
     */
    omit?: AttachmentsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentsInclude<ExtArgs> | null
    /**
     * Filter which Attachments to delete.
     */
    where: AttachmentsWhereUniqueInput
  }

  /**
   * Attachments deleteMany
   */
  export type AttachmentsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Attachments to delete
     */
    where?: AttachmentsWhereInput
    /**
     * Limit how many Attachments to delete.
     */
    limit?: number
  }

  /**
   * Attachments without action
   */
  export type AttachmentsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Attachments
     */
    select?: AttachmentsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Attachments
     */
    omit?: AttachmentsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AttachmentsInclude<ExtArgs> | null
  }


  /**
   * Model Notification
   */

  export type AggregateNotification = {
    _count: NotificationCountAggregateOutputType | null
    _avg: NotificationAvgAggregateOutputType | null
    _sum: NotificationSumAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  export type NotificationAvgAggregateOutputType = {
    id: number | null
    createdById: number | null
    ticketId: number | null
    messageId: number | null
  }

  export type NotificationSumAggregateOutputType = {
    id: number | null
    createdById: number | null
    ticketId: number | null
    messageId: number | null
  }

  export type NotificationMinAggregateOutputType = {
    id: number | null
    title: string | null
    description: string | null
    type: string | null
    createdAt: Date | null
    createdById: number | null
    ticketId: number | null
    messageId: number | null
  }

  export type NotificationMaxAggregateOutputType = {
    id: number | null
    title: string | null
    description: string | null
    type: string | null
    createdAt: Date | null
    createdById: number | null
    ticketId: number | null
    messageId: number | null
  }

  export type NotificationCountAggregateOutputType = {
    id: number
    title: number
    description: number
    type: number
    createdAt: number
    createdById: number
    ticketId: number
    messageId: number
    _all: number
  }


  export type NotificationAvgAggregateInputType = {
    id?: true
    createdById?: true
    ticketId?: true
    messageId?: true
  }

  export type NotificationSumAggregateInputType = {
    id?: true
    createdById?: true
    ticketId?: true
    messageId?: true
  }

  export type NotificationMinAggregateInputType = {
    id?: true
    title?: true
    description?: true
    type?: true
    createdAt?: true
    createdById?: true
    ticketId?: true
    messageId?: true
  }

  export type NotificationMaxAggregateInputType = {
    id?: true
    title?: true
    description?: true
    type?: true
    createdAt?: true
    createdById?: true
    ticketId?: true
    messageId?: true
  }

  export type NotificationCountAggregateInputType = {
    id?: true
    title?: true
    description?: true
    type?: true
    createdAt?: true
    createdById?: true
    ticketId?: true
    messageId?: true
    _all?: true
  }

  export type NotificationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notification to aggregate.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Notifications
    **/
    _count?: true | NotificationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: NotificationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: NotificationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NotificationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NotificationMaxAggregateInputType
  }

  export type GetNotificationAggregateType<T extends NotificationAggregateArgs> = {
        [P in keyof T & keyof AggregateNotification]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNotification[P]>
      : GetScalarType<T[P], AggregateNotification[P]>
  }




  export type NotificationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithAggregationInput | NotificationOrderByWithAggregationInput[]
    by: NotificationScalarFieldEnum[] | NotificationScalarFieldEnum
    having?: NotificationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NotificationCountAggregateInputType | true
    _avg?: NotificationAvgAggregateInputType
    _sum?: NotificationSumAggregateInputType
    _min?: NotificationMinAggregateInputType
    _max?: NotificationMaxAggregateInputType
  }

  export type NotificationGroupByOutputType = {
    id: number
    title: string
    description: string
    type: string
    createdAt: Date
    createdById: number
    ticketId: number | null
    messageId: number | null
    _count: NotificationCountAggregateOutputType | null
    _avg: NotificationAvgAggregateOutputType | null
    _sum: NotificationSumAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  type GetNotificationGroupByPayload<T extends NotificationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NotificationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NotificationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NotificationGroupByOutputType[P]>
            : GetScalarType<T[P], NotificationGroupByOutputType[P]>
        }
      >
    >


  export type NotificationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    type?: boolean
    createdAt?: boolean
    createdById?: boolean
    ticketId?: boolean
    messageId?: boolean
    message?: boolean | Notification$messageArgs<ExtArgs>
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
    ticket?: boolean | Notification$ticketArgs<ExtArgs>
    recipients?: boolean | Notification$recipientsArgs<ExtArgs>
    _count?: boolean | NotificationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notification"]>



  export type NotificationSelectScalar = {
    id?: boolean
    title?: boolean
    description?: boolean
    type?: boolean
    createdAt?: boolean
    createdById?: boolean
    ticketId?: boolean
    messageId?: boolean
  }

  export type NotificationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "description" | "type" | "createdAt" | "createdById" | "ticketId" | "messageId", ExtArgs["result"]["notification"]>
  export type NotificationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    message?: boolean | Notification$messageArgs<ExtArgs>
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
    ticket?: boolean | Notification$ticketArgs<ExtArgs>
    recipients?: boolean | Notification$recipientsArgs<ExtArgs>
    _count?: boolean | NotificationCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $NotificationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Notification"
    objects: {
      message: Prisma.$MessagePayload<ExtArgs> | null
      createdBy: Prisma.$UserPayload<ExtArgs>
      ticket: Prisma.$TicketPayload<ExtArgs> | null
      recipients: Prisma.$NotificationRecipientPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      title: string
      description: string
      type: string
      createdAt: Date
      createdById: number
      ticketId: number | null
      messageId: number | null
    }, ExtArgs["result"]["notification"]>
    composites: {}
  }

  type NotificationGetPayload<S extends boolean | null | undefined | NotificationDefaultArgs> = $Result.GetResult<Prisma.$NotificationPayload, S>

  type NotificationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<NotificationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: NotificationCountAggregateInputType | true
    }

  export interface NotificationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Notification'], meta: { name: 'Notification' } }
    /**
     * Find zero or one Notification that matches the filter.
     * @param {NotificationFindUniqueArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NotificationFindUniqueArgs>(args: SelectSubset<T, NotificationFindUniqueArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Notification that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NotificationFindUniqueOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NotificationFindUniqueOrThrowArgs>(args: SelectSubset<T, NotificationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Notification that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindFirstArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NotificationFindFirstArgs>(args?: SelectSubset<T, NotificationFindFirstArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Notification that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindFirstOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NotificationFindFirstOrThrowArgs>(args?: SelectSubset<T, NotificationFindFirstOrThrowArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Notifications that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Notifications
     * const notifications = await prisma.notification.findMany()
     * 
     * // Get first 10 Notifications
     * const notifications = await prisma.notification.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const notificationWithIdOnly = await prisma.notification.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends NotificationFindManyArgs>(args?: SelectSubset<T, NotificationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Notification.
     * @param {NotificationCreateArgs} args - Arguments to create a Notification.
     * @example
     * // Create one Notification
     * const Notification = await prisma.notification.create({
     *   data: {
     *     // ... data to create a Notification
     *   }
     * })
     * 
     */
    create<T extends NotificationCreateArgs>(args: SelectSubset<T, NotificationCreateArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Notifications.
     * @param {NotificationCreateManyArgs} args - Arguments to create many Notifications.
     * @example
     * // Create many Notifications
     * const notification = await prisma.notification.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NotificationCreateManyArgs>(args?: SelectSubset<T, NotificationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Notification.
     * @param {NotificationDeleteArgs} args - Arguments to delete one Notification.
     * @example
     * // Delete one Notification
     * const Notification = await prisma.notification.delete({
     *   where: {
     *     // ... filter to delete one Notification
     *   }
     * })
     * 
     */
    delete<T extends NotificationDeleteArgs>(args: SelectSubset<T, NotificationDeleteArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Notification.
     * @param {NotificationUpdateArgs} args - Arguments to update one Notification.
     * @example
     * // Update one Notification
     * const notification = await prisma.notification.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NotificationUpdateArgs>(args: SelectSubset<T, NotificationUpdateArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Notifications.
     * @param {NotificationDeleteManyArgs} args - Arguments to filter Notifications to delete.
     * @example
     * // Delete a few Notifications
     * const { count } = await prisma.notification.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NotificationDeleteManyArgs>(args?: SelectSubset<T, NotificationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Notifications
     * const notification = await prisma.notification.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NotificationUpdateManyArgs>(args: SelectSubset<T, NotificationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Notification.
     * @param {NotificationUpsertArgs} args - Arguments to update or create a Notification.
     * @example
     * // Update or create a Notification
     * const notification = await prisma.notification.upsert({
     *   create: {
     *     // ... data to create a Notification
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Notification we want to update
     *   }
     * })
     */
    upsert<T extends NotificationUpsertArgs>(args: SelectSubset<T, NotificationUpsertArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationCountArgs} args - Arguments to filter Notifications to count.
     * @example
     * // Count the number of Notifications
     * const count = await prisma.notification.count({
     *   where: {
     *     // ... the filter for the Notifications we want to count
     *   }
     * })
    **/
    count<T extends NotificationCountArgs>(
      args?: Subset<T, NotificationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NotificationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends NotificationAggregateArgs>(args: Subset<T, NotificationAggregateArgs>): Prisma.PrismaPromise<GetNotificationAggregateType<T>>

    /**
     * Group by Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends NotificationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NotificationGroupByArgs['orderBy'] }
        : { orderBy?: NotificationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, NotificationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotificationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Notification model
   */
  readonly fields: NotificationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Notification.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NotificationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    message<T extends Notification$messageArgs<ExtArgs> = {}>(args?: Subset<T, Notification$messageArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    createdBy<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    ticket<T extends Notification$ticketArgs<ExtArgs> = {}>(args?: Subset<T, Notification$ticketArgs<ExtArgs>>): Prisma__TicketClient<$Result.GetResult<Prisma.$TicketPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    recipients<T extends Notification$recipientsArgs<ExtArgs> = {}>(args?: Subset<T, Notification$recipientsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationRecipientPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Notification model
   */
  interface NotificationFieldRefs {
    readonly id: FieldRef<"Notification", 'Int'>
    readonly title: FieldRef<"Notification", 'String'>
    readonly description: FieldRef<"Notification", 'String'>
    readonly type: FieldRef<"Notification", 'String'>
    readonly createdAt: FieldRef<"Notification", 'DateTime'>
    readonly createdById: FieldRef<"Notification", 'Int'>
    readonly ticketId: FieldRef<"Notification", 'Int'>
    readonly messageId: FieldRef<"Notification", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Notification findUnique
   */
  export type NotificationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification findUniqueOrThrow
   */
  export type NotificationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification findFirst
   */
  export type NotificationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification findFirstOrThrow
   */
  export type NotificationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification findMany
   */
  export type NotificationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notifications to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification create
   */
  export type NotificationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The data needed to create a Notification.
     */
    data: XOR<NotificationCreateInput, NotificationUncheckedCreateInput>
  }

  /**
   * Notification createMany
   */
  export type NotificationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Notifications.
     */
    data: NotificationCreateManyInput | NotificationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Notification update
   */
  export type NotificationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The data needed to update a Notification.
     */
    data: XOR<NotificationUpdateInput, NotificationUncheckedUpdateInput>
    /**
     * Choose, which Notification to update.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification updateMany
   */
  export type NotificationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Notifications.
     */
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyInput>
    /**
     * Filter which Notifications to update
     */
    where?: NotificationWhereInput
    /**
     * Limit how many Notifications to update.
     */
    limit?: number
  }

  /**
   * Notification upsert
   */
  export type NotificationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The filter to search for the Notification to update in case it exists.
     */
    where: NotificationWhereUniqueInput
    /**
     * In case the Notification found by the `where` argument doesn't exist, create a new Notification with this data.
     */
    create: XOR<NotificationCreateInput, NotificationUncheckedCreateInput>
    /**
     * In case the Notification was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NotificationUpdateInput, NotificationUncheckedUpdateInput>
  }

  /**
   * Notification delete
   */
  export type NotificationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter which Notification to delete.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification deleteMany
   */
  export type NotificationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notifications to delete
     */
    where?: NotificationWhereInput
    /**
     * Limit how many Notifications to delete.
     */
    limit?: number
  }

  /**
   * Notification.message
   */
  export type Notification$messageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    where?: MessageWhereInput
  }

  /**
   * Notification.ticket
   */
  export type Notification$ticketArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ticket
     */
    select?: TicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Ticket
     */
    omit?: TicketOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TicketInclude<ExtArgs> | null
    where?: TicketWhereInput
  }

  /**
   * Notification.recipients
   */
  export type Notification$recipientsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationRecipient
     */
    select?: NotificationRecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationRecipient
     */
    omit?: NotificationRecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationRecipientInclude<ExtArgs> | null
    where?: NotificationRecipientWhereInput
    orderBy?: NotificationRecipientOrderByWithRelationInput | NotificationRecipientOrderByWithRelationInput[]
    cursor?: NotificationRecipientWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NotificationRecipientScalarFieldEnum | NotificationRecipientScalarFieldEnum[]
  }

  /**
   * Notification without action
   */
  export type NotificationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
  }


  /**
   * Model NotificationRecipient
   */

  export type AggregateNotificationRecipient = {
    _count: NotificationRecipientCountAggregateOutputType | null
    _avg: NotificationRecipientAvgAggregateOutputType | null
    _sum: NotificationRecipientSumAggregateOutputType | null
    _min: NotificationRecipientMinAggregateOutputType | null
    _max: NotificationRecipientMaxAggregateOutputType | null
  }

  export type NotificationRecipientAvgAggregateOutputType = {
    id: number | null
    notificationId: number | null
    userId: number | null
  }

  export type NotificationRecipientSumAggregateOutputType = {
    id: number | null
    notificationId: number | null
    userId: number | null
  }

  export type NotificationRecipientMinAggregateOutputType = {
    id: number | null
    notificationId: number | null
    userId: number | null
    seen: boolean | null
    seenAt: Date | null
  }

  export type NotificationRecipientMaxAggregateOutputType = {
    id: number | null
    notificationId: number | null
    userId: number | null
    seen: boolean | null
    seenAt: Date | null
  }

  export type NotificationRecipientCountAggregateOutputType = {
    id: number
    notificationId: number
    userId: number
    seen: number
    seenAt: number
    _all: number
  }


  export type NotificationRecipientAvgAggregateInputType = {
    id?: true
    notificationId?: true
    userId?: true
  }

  export type NotificationRecipientSumAggregateInputType = {
    id?: true
    notificationId?: true
    userId?: true
  }

  export type NotificationRecipientMinAggregateInputType = {
    id?: true
    notificationId?: true
    userId?: true
    seen?: true
    seenAt?: true
  }

  export type NotificationRecipientMaxAggregateInputType = {
    id?: true
    notificationId?: true
    userId?: true
    seen?: true
    seenAt?: true
  }

  export type NotificationRecipientCountAggregateInputType = {
    id?: true
    notificationId?: true
    userId?: true
    seen?: true
    seenAt?: true
    _all?: true
  }

  export type NotificationRecipientAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NotificationRecipient to aggregate.
     */
    where?: NotificationRecipientWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationRecipients to fetch.
     */
    orderBy?: NotificationRecipientOrderByWithRelationInput | NotificationRecipientOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NotificationRecipientWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationRecipients from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationRecipients.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned NotificationRecipients
    **/
    _count?: true | NotificationRecipientCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: NotificationRecipientAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: NotificationRecipientSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NotificationRecipientMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NotificationRecipientMaxAggregateInputType
  }

  export type GetNotificationRecipientAggregateType<T extends NotificationRecipientAggregateArgs> = {
        [P in keyof T & keyof AggregateNotificationRecipient]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNotificationRecipient[P]>
      : GetScalarType<T[P], AggregateNotificationRecipient[P]>
  }




  export type NotificationRecipientGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationRecipientWhereInput
    orderBy?: NotificationRecipientOrderByWithAggregationInput | NotificationRecipientOrderByWithAggregationInput[]
    by: NotificationRecipientScalarFieldEnum[] | NotificationRecipientScalarFieldEnum
    having?: NotificationRecipientScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NotificationRecipientCountAggregateInputType | true
    _avg?: NotificationRecipientAvgAggregateInputType
    _sum?: NotificationRecipientSumAggregateInputType
    _min?: NotificationRecipientMinAggregateInputType
    _max?: NotificationRecipientMaxAggregateInputType
  }

  export type NotificationRecipientGroupByOutputType = {
    id: number
    notificationId: number
    userId: number
    seen: boolean
    seenAt: Date | null
    _count: NotificationRecipientCountAggregateOutputType | null
    _avg: NotificationRecipientAvgAggregateOutputType | null
    _sum: NotificationRecipientSumAggregateOutputType | null
    _min: NotificationRecipientMinAggregateOutputType | null
    _max: NotificationRecipientMaxAggregateOutputType | null
  }

  type GetNotificationRecipientGroupByPayload<T extends NotificationRecipientGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NotificationRecipientGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NotificationRecipientGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NotificationRecipientGroupByOutputType[P]>
            : GetScalarType<T[P], NotificationRecipientGroupByOutputType[P]>
        }
      >
    >


  export type NotificationRecipientSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    notificationId?: boolean
    userId?: boolean
    seen?: boolean
    seenAt?: boolean
    notification?: boolean | NotificationDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notificationRecipient"]>



  export type NotificationRecipientSelectScalar = {
    id?: boolean
    notificationId?: boolean
    userId?: boolean
    seen?: boolean
    seenAt?: boolean
  }

  export type NotificationRecipientOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "notificationId" | "userId" | "seen" | "seenAt", ExtArgs["result"]["notificationRecipient"]>
  export type NotificationRecipientInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    notification?: boolean | NotificationDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $NotificationRecipientPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "NotificationRecipient"
    objects: {
      notification: Prisma.$NotificationPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      notificationId: number
      userId: number
      seen: boolean
      seenAt: Date | null
    }, ExtArgs["result"]["notificationRecipient"]>
    composites: {}
  }

  type NotificationRecipientGetPayload<S extends boolean | null | undefined | NotificationRecipientDefaultArgs> = $Result.GetResult<Prisma.$NotificationRecipientPayload, S>

  type NotificationRecipientCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<NotificationRecipientFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: NotificationRecipientCountAggregateInputType | true
    }

  export interface NotificationRecipientDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['NotificationRecipient'], meta: { name: 'NotificationRecipient' } }
    /**
     * Find zero or one NotificationRecipient that matches the filter.
     * @param {NotificationRecipientFindUniqueArgs} args - Arguments to find a NotificationRecipient
     * @example
     * // Get one NotificationRecipient
     * const notificationRecipient = await prisma.notificationRecipient.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NotificationRecipientFindUniqueArgs>(args: SelectSubset<T, NotificationRecipientFindUniqueArgs<ExtArgs>>): Prisma__NotificationRecipientClient<$Result.GetResult<Prisma.$NotificationRecipientPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one NotificationRecipient that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NotificationRecipientFindUniqueOrThrowArgs} args - Arguments to find a NotificationRecipient
     * @example
     * // Get one NotificationRecipient
     * const notificationRecipient = await prisma.notificationRecipient.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NotificationRecipientFindUniqueOrThrowArgs>(args: SelectSubset<T, NotificationRecipientFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NotificationRecipientClient<$Result.GetResult<Prisma.$NotificationRecipientPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first NotificationRecipient that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationRecipientFindFirstArgs} args - Arguments to find a NotificationRecipient
     * @example
     * // Get one NotificationRecipient
     * const notificationRecipient = await prisma.notificationRecipient.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NotificationRecipientFindFirstArgs>(args?: SelectSubset<T, NotificationRecipientFindFirstArgs<ExtArgs>>): Prisma__NotificationRecipientClient<$Result.GetResult<Prisma.$NotificationRecipientPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first NotificationRecipient that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationRecipientFindFirstOrThrowArgs} args - Arguments to find a NotificationRecipient
     * @example
     * // Get one NotificationRecipient
     * const notificationRecipient = await prisma.notificationRecipient.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NotificationRecipientFindFirstOrThrowArgs>(args?: SelectSubset<T, NotificationRecipientFindFirstOrThrowArgs<ExtArgs>>): Prisma__NotificationRecipientClient<$Result.GetResult<Prisma.$NotificationRecipientPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more NotificationRecipients that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationRecipientFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all NotificationRecipients
     * const notificationRecipients = await prisma.notificationRecipient.findMany()
     * 
     * // Get first 10 NotificationRecipients
     * const notificationRecipients = await prisma.notificationRecipient.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const notificationRecipientWithIdOnly = await prisma.notificationRecipient.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends NotificationRecipientFindManyArgs>(args?: SelectSubset<T, NotificationRecipientFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationRecipientPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a NotificationRecipient.
     * @param {NotificationRecipientCreateArgs} args - Arguments to create a NotificationRecipient.
     * @example
     * // Create one NotificationRecipient
     * const NotificationRecipient = await prisma.notificationRecipient.create({
     *   data: {
     *     // ... data to create a NotificationRecipient
     *   }
     * })
     * 
     */
    create<T extends NotificationRecipientCreateArgs>(args: SelectSubset<T, NotificationRecipientCreateArgs<ExtArgs>>): Prisma__NotificationRecipientClient<$Result.GetResult<Prisma.$NotificationRecipientPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many NotificationRecipients.
     * @param {NotificationRecipientCreateManyArgs} args - Arguments to create many NotificationRecipients.
     * @example
     * // Create many NotificationRecipients
     * const notificationRecipient = await prisma.notificationRecipient.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NotificationRecipientCreateManyArgs>(args?: SelectSubset<T, NotificationRecipientCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a NotificationRecipient.
     * @param {NotificationRecipientDeleteArgs} args - Arguments to delete one NotificationRecipient.
     * @example
     * // Delete one NotificationRecipient
     * const NotificationRecipient = await prisma.notificationRecipient.delete({
     *   where: {
     *     // ... filter to delete one NotificationRecipient
     *   }
     * })
     * 
     */
    delete<T extends NotificationRecipientDeleteArgs>(args: SelectSubset<T, NotificationRecipientDeleteArgs<ExtArgs>>): Prisma__NotificationRecipientClient<$Result.GetResult<Prisma.$NotificationRecipientPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one NotificationRecipient.
     * @param {NotificationRecipientUpdateArgs} args - Arguments to update one NotificationRecipient.
     * @example
     * // Update one NotificationRecipient
     * const notificationRecipient = await prisma.notificationRecipient.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NotificationRecipientUpdateArgs>(args: SelectSubset<T, NotificationRecipientUpdateArgs<ExtArgs>>): Prisma__NotificationRecipientClient<$Result.GetResult<Prisma.$NotificationRecipientPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more NotificationRecipients.
     * @param {NotificationRecipientDeleteManyArgs} args - Arguments to filter NotificationRecipients to delete.
     * @example
     * // Delete a few NotificationRecipients
     * const { count } = await prisma.notificationRecipient.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NotificationRecipientDeleteManyArgs>(args?: SelectSubset<T, NotificationRecipientDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NotificationRecipients.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationRecipientUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many NotificationRecipients
     * const notificationRecipient = await prisma.notificationRecipient.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NotificationRecipientUpdateManyArgs>(args: SelectSubset<T, NotificationRecipientUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one NotificationRecipient.
     * @param {NotificationRecipientUpsertArgs} args - Arguments to update or create a NotificationRecipient.
     * @example
     * // Update or create a NotificationRecipient
     * const notificationRecipient = await prisma.notificationRecipient.upsert({
     *   create: {
     *     // ... data to create a NotificationRecipient
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the NotificationRecipient we want to update
     *   }
     * })
     */
    upsert<T extends NotificationRecipientUpsertArgs>(args: SelectSubset<T, NotificationRecipientUpsertArgs<ExtArgs>>): Prisma__NotificationRecipientClient<$Result.GetResult<Prisma.$NotificationRecipientPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of NotificationRecipients.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationRecipientCountArgs} args - Arguments to filter NotificationRecipients to count.
     * @example
     * // Count the number of NotificationRecipients
     * const count = await prisma.notificationRecipient.count({
     *   where: {
     *     // ... the filter for the NotificationRecipients we want to count
     *   }
     * })
    **/
    count<T extends NotificationRecipientCountArgs>(
      args?: Subset<T, NotificationRecipientCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NotificationRecipientCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a NotificationRecipient.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationRecipientAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends NotificationRecipientAggregateArgs>(args: Subset<T, NotificationRecipientAggregateArgs>): Prisma.PrismaPromise<GetNotificationRecipientAggregateType<T>>

    /**
     * Group by NotificationRecipient.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationRecipientGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends NotificationRecipientGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NotificationRecipientGroupByArgs['orderBy'] }
        : { orderBy?: NotificationRecipientGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, NotificationRecipientGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotificationRecipientGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the NotificationRecipient model
   */
  readonly fields: NotificationRecipientFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for NotificationRecipient.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NotificationRecipientClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    notification<T extends NotificationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, NotificationDefaultArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the NotificationRecipient model
   */
  interface NotificationRecipientFieldRefs {
    readonly id: FieldRef<"NotificationRecipient", 'Int'>
    readonly notificationId: FieldRef<"NotificationRecipient", 'Int'>
    readonly userId: FieldRef<"NotificationRecipient", 'Int'>
    readonly seen: FieldRef<"NotificationRecipient", 'Boolean'>
    readonly seenAt: FieldRef<"NotificationRecipient", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * NotificationRecipient findUnique
   */
  export type NotificationRecipientFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationRecipient
     */
    select?: NotificationRecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationRecipient
     */
    omit?: NotificationRecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationRecipientInclude<ExtArgs> | null
    /**
     * Filter, which NotificationRecipient to fetch.
     */
    where: NotificationRecipientWhereUniqueInput
  }

  /**
   * NotificationRecipient findUniqueOrThrow
   */
  export type NotificationRecipientFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationRecipient
     */
    select?: NotificationRecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationRecipient
     */
    omit?: NotificationRecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationRecipientInclude<ExtArgs> | null
    /**
     * Filter, which NotificationRecipient to fetch.
     */
    where: NotificationRecipientWhereUniqueInput
  }

  /**
   * NotificationRecipient findFirst
   */
  export type NotificationRecipientFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationRecipient
     */
    select?: NotificationRecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationRecipient
     */
    omit?: NotificationRecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationRecipientInclude<ExtArgs> | null
    /**
     * Filter, which NotificationRecipient to fetch.
     */
    where?: NotificationRecipientWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationRecipients to fetch.
     */
    orderBy?: NotificationRecipientOrderByWithRelationInput | NotificationRecipientOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NotificationRecipients.
     */
    cursor?: NotificationRecipientWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationRecipients from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationRecipients.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NotificationRecipients.
     */
    distinct?: NotificationRecipientScalarFieldEnum | NotificationRecipientScalarFieldEnum[]
  }

  /**
   * NotificationRecipient findFirstOrThrow
   */
  export type NotificationRecipientFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationRecipient
     */
    select?: NotificationRecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationRecipient
     */
    omit?: NotificationRecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationRecipientInclude<ExtArgs> | null
    /**
     * Filter, which NotificationRecipient to fetch.
     */
    where?: NotificationRecipientWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationRecipients to fetch.
     */
    orderBy?: NotificationRecipientOrderByWithRelationInput | NotificationRecipientOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NotificationRecipients.
     */
    cursor?: NotificationRecipientWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationRecipients from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationRecipients.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NotificationRecipients.
     */
    distinct?: NotificationRecipientScalarFieldEnum | NotificationRecipientScalarFieldEnum[]
  }

  /**
   * NotificationRecipient findMany
   */
  export type NotificationRecipientFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationRecipient
     */
    select?: NotificationRecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationRecipient
     */
    omit?: NotificationRecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationRecipientInclude<ExtArgs> | null
    /**
     * Filter, which NotificationRecipients to fetch.
     */
    where?: NotificationRecipientWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationRecipients to fetch.
     */
    orderBy?: NotificationRecipientOrderByWithRelationInput | NotificationRecipientOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing NotificationRecipients.
     */
    cursor?: NotificationRecipientWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationRecipients from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationRecipients.
     */
    skip?: number
    distinct?: NotificationRecipientScalarFieldEnum | NotificationRecipientScalarFieldEnum[]
  }

  /**
   * NotificationRecipient create
   */
  export type NotificationRecipientCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationRecipient
     */
    select?: NotificationRecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationRecipient
     */
    omit?: NotificationRecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationRecipientInclude<ExtArgs> | null
    /**
     * The data needed to create a NotificationRecipient.
     */
    data: XOR<NotificationRecipientCreateInput, NotificationRecipientUncheckedCreateInput>
  }

  /**
   * NotificationRecipient createMany
   */
  export type NotificationRecipientCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many NotificationRecipients.
     */
    data: NotificationRecipientCreateManyInput | NotificationRecipientCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * NotificationRecipient update
   */
  export type NotificationRecipientUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationRecipient
     */
    select?: NotificationRecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationRecipient
     */
    omit?: NotificationRecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationRecipientInclude<ExtArgs> | null
    /**
     * The data needed to update a NotificationRecipient.
     */
    data: XOR<NotificationRecipientUpdateInput, NotificationRecipientUncheckedUpdateInput>
    /**
     * Choose, which NotificationRecipient to update.
     */
    where: NotificationRecipientWhereUniqueInput
  }

  /**
   * NotificationRecipient updateMany
   */
  export type NotificationRecipientUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update NotificationRecipients.
     */
    data: XOR<NotificationRecipientUpdateManyMutationInput, NotificationRecipientUncheckedUpdateManyInput>
    /**
     * Filter which NotificationRecipients to update
     */
    where?: NotificationRecipientWhereInput
    /**
     * Limit how many NotificationRecipients to update.
     */
    limit?: number
  }

  /**
   * NotificationRecipient upsert
   */
  export type NotificationRecipientUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationRecipient
     */
    select?: NotificationRecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationRecipient
     */
    omit?: NotificationRecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationRecipientInclude<ExtArgs> | null
    /**
     * The filter to search for the NotificationRecipient to update in case it exists.
     */
    where: NotificationRecipientWhereUniqueInput
    /**
     * In case the NotificationRecipient found by the `where` argument doesn't exist, create a new NotificationRecipient with this data.
     */
    create: XOR<NotificationRecipientCreateInput, NotificationRecipientUncheckedCreateInput>
    /**
     * In case the NotificationRecipient was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NotificationRecipientUpdateInput, NotificationRecipientUncheckedUpdateInput>
  }

  /**
   * NotificationRecipient delete
   */
  export type NotificationRecipientDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationRecipient
     */
    select?: NotificationRecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationRecipient
     */
    omit?: NotificationRecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationRecipientInclude<ExtArgs> | null
    /**
     * Filter which NotificationRecipient to delete.
     */
    where: NotificationRecipientWhereUniqueInput
  }

  /**
   * NotificationRecipient deleteMany
   */
  export type NotificationRecipientDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NotificationRecipients to delete
     */
    where?: NotificationRecipientWhereInput
    /**
     * Limit how many NotificationRecipients to delete.
     */
    limit?: number
  }

  /**
   * NotificationRecipient without action
   */
  export type NotificationRecipientDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationRecipient
     */
    select?: NotificationRecipientSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationRecipient
     */
    omit?: NotificationRecipientOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationRecipientInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    name: 'name',
    phone: 'phone',
    password: 'password',
    role: 'role',
    lastLogin: 'lastLogin',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const TicketScalarFieldEnum: {
    id: 'id',
    ticketCode: 'ticketCode',
    description: 'description',
    customerName: 'customerName',
    controllerNo: 'controllerNo',
    head: 'head',
    imei: 'imei',
    hp: 'hp',
    motorType: 'motorType',
    state: 'state',
    district: 'district',
    village: 'village',
    block: 'block',
    complaintType: 'complaintType',
    faultCode: 'faultCode',
    status: 'status',
    createdBy: 'createdBy',
    updatedBy: 'updatedBy',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt'
  };

  export type TicketScalarFieldEnum = (typeof TicketScalarFieldEnum)[keyof typeof TicketScalarFieldEnum]


  export const MessageScalarFieldEnum: {
    id: 'id',
    content: 'content',
    createdAt: 'createdAt',
    senderId: 'senderId',
    ticketId: 'ticketId'
  };

  export type MessageScalarFieldEnum = (typeof MessageScalarFieldEnum)[keyof typeof MessageScalarFieldEnum]


  export const MessageSeenScalarFieldEnum: {
    id: 'id',
    seenAt: 'seenAt',
    messageId: 'messageId',
    userId: 'userId'
  };

  export type MessageSeenScalarFieldEnum = (typeof MessageSeenScalarFieldEnum)[keyof typeof MessageSeenScalarFieldEnum]


  export const AttachmentsScalarFieldEnum: {
    id: 'id',
    fileName: 'fileName',
    fileType: 'fileType',
    fileSize: 'fileSize',
    fileUrl: 'fileUrl',
    createdAt: 'createdAt',
    messageId: 'messageId'
  };

  export type AttachmentsScalarFieldEnum = (typeof AttachmentsScalarFieldEnum)[keyof typeof AttachmentsScalarFieldEnum]


  export const NotificationScalarFieldEnum: {
    id: 'id',
    title: 'title',
    description: 'description',
    type: 'type',
    createdAt: 'createdAt',
    createdById: 'createdById',
    ticketId: 'ticketId',
    messageId: 'messageId'
  };

  export type NotificationScalarFieldEnum = (typeof NotificationScalarFieldEnum)[keyof typeof NotificationScalarFieldEnum]


  export const NotificationRecipientScalarFieldEnum: {
    id: 'id',
    notificationId: 'notificationId',
    userId: 'userId',
    seen: 'seen',
    seenAt: 'seenAt'
  };

  export type NotificationRecipientScalarFieldEnum = (typeof NotificationRecipientScalarFieldEnum)[keyof typeof NotificationRecipientScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const UserOrderByRelevanceFieldEnum: {
    name: 'name',
    phone: 'phone',
    password: 'password'
  };

  export type UserOrderByRelevanceFieldEnum = (typeof UserOrderByRelevanceFieldEnum)[keyof typeof UserOrderByRelevanceFieldEnum]


  export const TicketOrderByRelevanceFieldEnum: {
    ticketCode: 'ticketCode',
    description: 'description',
    customerName: 'customerName',
    controllerNo: 'controllerNo',
    head: 'head',
    imei: 'imei',
    hp: 'hp',
    motorType: 'motorType',
    state: 'state',
    district: 'district',
    village: 'village',
    block: 'block',
    complaintType: 'complaintType',
    faultCode: 'faultCode'
  };

  export type TicketOrderByRelevanceFieldEnum = (typeof TicketOrderByRelevanceFieldEnum)[keyof typeof TicketOrderByRelevanceFieldEnum]


  export const MessageOrderByRelevanceFieldEnum: {
    content: 'content'
  };

  export type MessageOrderByRelevanceFieldEnum = (typeof MessageOrderByRelevanceFieldEnum)[keyof typeof MessageOrderByRelevanceFieldEnum]


  export const AttachmentsOrderByRelevanceFieldEnum: {
    fileName: 'fileName',
    fileType: 'fileType',
    fileUrl: 'fileUrl'
  };

  export type AttachmentsOrderByRelevanceFieldEnum = (typeof AttachmentsOrderByRelevanceFieldEnum)[keyof typeof AttachmentsOrderByRelevanceFieldEnum]


  export const NotificationOrderByRelevanceFieldEnum: {
    title: 'title',
    description: 'description',
    type: 'type'
  };

  export type NotificationOrderByRelevanceFieldEnum = (typeof NotificationOrderByRelevanceFieldEnum)[keyof typeof NotificationOrderByRelevanceFieldEnum]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'TicketStatus'
   */
  export type EnumTicketStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TicketStatus'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: IntFilter<"User"> | number
    name?: StringFilter<"User"> | string
    phone?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    lastLogin?: DateTimeNullableFilter<"User"> | Date | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    deletedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    createdTickets?: TicketListRelationFilter
    updatedTickets?: TicketListRelationFilter
    messages?: MessageListRelationFilter
    messageSeens?: MessageSeenListRelationFilter
    sentNotifications?: NotificationListRelationFilter
    notificationRecipients?: NotificationRecipientListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    password?: SortOrder
    role?: SortOrder
    lastLogin?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrderInput | SortOrder
    deletedAt?: SortOrderInput | SortOrder
    createdTickets?: TicketOrderByRelationAggregateInput
    updatedTickets?: TicketOrderByRelationAggregateInput
    messages?: MessageOrderByRelationAggregateInput
    messageSeens?: MessageSeenOrderByRelationAggregateInput
    sentNotifications?: NotificationOrderByRelationAggregateInput
    notificationRecipients?: NotificationRecipientOrderByRelationAggregateInput
    _relevance?: UserOrderByRelevanceInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    phone?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    lastLogin?: DateTimeNullableFilter<"User"> | Date | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    deletedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    createdTickets?: TicketListRelationFilter
    updatedTickets?: TicketListRelationFilter
    messages?: MessageListRelationFilter
    messageSeens?: MessageSeenListRelationFilter
    sentNotifications?: NotificationListRelationFilter
    notificationRecipients?: NotificationRecipientListRelationFilter
  }, "id" | "phone">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    password?: SortOrder
    role?: SortOrder
    lastLogin?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrderInput | SortOrder
    deletedAt?: SortOrderInput | SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"User"> | number
    name?: StringWithAggregatesFilter<"User"> | string
    phone?: StringWithAggregatesFilter<"User"> | string
    password?: StringWithAggregatesFilter<"User"> | string
    role?: EnumRoleWithAggregatesFilter<"User"> | $Enums.Role
    lastLogin?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    deletedAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
  }

  export type TicketWhereInput = {
    AND?: TicketWhereInput | TicketWhereInput[]
    OR?: TicketWhereInput[]
    NOT?: TicketWhereInput | TicketWhereInput[]
    id?: IntFilter<"Ticket"> | number
    ticketCode?: StringFilter<"Ticket"> | string
    description?: StringFilter<"Ticket"> | string
    customerName?: StringFilter<"Ticket"> | string
    controllerNo?: StringFilter<"Ticket"> | string
    head?: StringNullableFilter<"Ticket"> | string | null
    imei?: StringNullableFilter<"Ticket"> | string | null
    hp?: StringNullableFilter<"Ticket"> | string | null
    motorType?: StringNullableFilter<"Ticket"> | string | null
    state?: StringFilter<"Ticket"> | string
    district?: StringFilter<"Ticket"> | string
    village?: StringNullableFilter<"Ticket"> | string | null
    block?: StringNullableFilter<"Ticket"> | string | null
    complaintType?: StringFilter<"Ticket"> | string
    faultCode?: StringFilter<"Ticket"> | string
    status?: EnumTicketStatusFilter<"Ticket"> | $Enums.TicketStatus
    createdBy?: IntFilter<"Ticket"> | number
    updatedBy?: IntNullableFilter<"Ticket"> | number | null
    createdAt?: DateTimeFilter<"Ticket"> | Date | string
    updatedAt?: DateTimeFilter<"Ticket"> | Date | string
    deletedAt?: DateTimeNullableFilter<"Ticket"> | Date | string | null
    createdByUser?: XOR<UserScalarRelationFilter, UserWhereInput>
    updatedByUser?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
    messages?: MessageListRelationFilter
    notifications?: NotificationListRelationFilter
  }

  export type TicketOrderByWithRelationInput = {
    id?: SortOrder
    ticketCode?: SortOrder
    description?: SortOrder
    customerName?: SortOrder
    controllerNo?: SortOrder
    head?: SortOrderInput | SortOrder
    imei?: SortOrderInput | SortOrder
    hp?: SortOrderInput | SortOrder
    motorType?: SortOrderInput | SortOrder
    state?: SortOrder
    district?: SortOrder
    village?: SortOrderInput | SortOrder
    block?: SortOrderInput | SortOrder
    complaintType?: SortOrder
    faultCode?: SortOrder
    status?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    createdByUser?: UserOrderByWithRelationInput
    updatedByUser?: UserOrderByWithRelationInput
    messages?: MessageOrderByRelationAggregateInput
    notifications?: NotificationOrderByRelationAggregateInput
    _relevance?: TicketOrderByRelevanceInput
  }

  export type TicketWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    ticketCode?: string
    AND?: TicketWhereInput | TicketWhereInput[]
    OR?: TicketWhereInput[]
    NOT?: TicketWhereInput | TicketWhereInput[]
    description?: StringFilter<"Ticket"> | string
    customerName?: StringFilter<"Ticket"> | string
    controllerNo?: StringFilter<"Ticket"> | string
    head?: StringNullableFilter<"Ticket"> | string | null
    imei?: StringNullableFilter<"Ticket"> | string | null
    hp?: StringNullableFilter<"Ticket"> | string | null
    motorType?: StringNullableFilter<"Ticket"> | string | null
    state?: StringFilter<"Ticket"> | string
    district?: StringFilter<"Ticket"> | string
    village?: StringNullableFilter<"Ticket"> | string | null
    block?: StringNullableFilter<"Ticket"> | string | null
    complaintType?: StringFilter<"Ticket"> | string
    faultCode?: StringFilter<"Ticket"> | string
    status?: EnumTicketStatusFilter<"Ticket"> | $Enums.TicketStatus
    createdBy?: IntFilter<"Ticket"> | number
    updatedBy?: IntNullableFilter<"Ticket"> | number | null
    createdAt?: DateTimeFilter<"Ticket"> | Date | string
    updatedAt?: DateTimeFilter<"Ticket"> | Date | string
    deletedAt?: DateTimeNullableFilter<"Ticket"> | Date | string | null
    createdByUser?: XOR<UserScalarRelationFilter, UserWhereInput>
    updatedByUser?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
    messages?: MessageListRelationFilter
    notifications?: NotificationListRelationFilter
  }, "id" | "ticketCode">

  export type TicketOrderByWithAggregationInput = {
    id?: SortOrder
    ticketCode?: SortOrder
    description?: SortOrder
    customerName?: SortOrder
    controllerNo?: SortOrder
    head?: SortOrderInput | SortOrder
    imei?: SortOrderInput | SortOrder
    hp?: SortOrderInput | SortOrder
    motorType?: SortOrderInput | SortOrder
    state?: SortOrder
    district?: SortOrder
    village?: SortOrderInput | SortOrder
    block?: SortOrderInput | SortOrder
    complaintType?: SortOrder
    faultCode?: SortOrder
    status?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    _count?: TicketCountOrderByAggregateInput
    _avg?: TicketAvgOrderByAggregateInput
    _max?: TicketMaxOrderByAggregateInput
    _min?: TicketMinOrderByAggregateInput
    _sum?: TicketSumOrderByAggregateInput
  }

  export type TicketScalarWhereWithAggregatesInput = {
    AND?: TicketScalarWhereWithAggregatesInput | TicketScalarWhereWithAggregatesInput[]
    OR?: TicketScalarWhereWithAggregatesInput[]
    NOT?: TicketScalarWhereWithAggregatesInput | TicketScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Ticket"> | number
    ticketCode?: StringWithAggregatesFilter<"Ticket"> | string
    description?: StringWithAggregatesFilter<"Ticket"> | string
    customerName?: StringWithAggregatesFilter<"Ticket"> | string
    controllerNo?: StringWithAggregatesFilter<"Ticket"> | string
    head?: StringNullableWithAggregatesFilter<"Ticket"> | string | null
    imei?: StringNullableWithAggregatesFilter<"Ticket"> | string | null
    hp?: StringNullableWithAggregatesFilter<"Ticket"> | string | null
    motorType?: StringNullableWithAggregatesFilter<"Ticket"> | string | null
    state?: StringWithAggregatesFilter<"Ticket"> | string
    district?: StringWithAggregatesFilter<"Ticket"> | string
    village?: StringNullableWithAggregatesFilter<"Ticket"> | string | null
    block?: StringNullableWithAggregatesFilter<"Ticket"> | string | null
    complaintType?: StringWithAggregatesFilter<"Ticket"> | string
    faultCode?: StringWithAggregatesFilter<"Ticket"> | string
    status?: EnumTicketStatusWithAggregatesFilter<"Ticket"> | $Enums.TicketStatus
    createdBy?: IntWithAggregatesFilter<"Ticket"> | number
    updatedBy?: IntNullableWithAggregatesFilter<"Ticket"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"Ticket"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Ticket"> | Date | string
    deletedAt?: DateTimeNullableWithAggregatesFilter<"Ticket"> | Date | string | null
  }

  export type MessageWhereInput = {
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    id?: IntFilter<"Message"> | number
    content?: StringFilter<"Message"> | string
    createdAt?: DateTimeFilter<"Message"> | Date | string
    senderId?: IntFilter<"Message"> | number
    ticketId?: IntFilter<"Message"> | number
    sender?: XOR<UserScalarRelationFilter, UserWhereInput>
    ticket?: XOR<TicketScalarRelationFilter, TicketWhereInput>
    notification?: NotificationListRelationFilter
    attachments?: AttachmentsListRelationFilter
    seenBy?: MessageSeenListRelationFilter
  }

  export type MessageOrderByWithRelationInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    senderId?: SortOrder
    ticketId?: SortOrder
    sender?: UserOrderByWithRelationInput
    ticket?: TicketOrderByWithRelationInput
    notification?: NotificationOrderByRelationAggregateInput
    attachments?: AttachmentsOrderByRelationAggregateInput
    seenBy?: MessageSeenOrderByRelationAggregateInput
    _relevance?: MessageOrderByRelevanceInput
  }

  export type MessageWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    content?: StringFilter<"Message"> | string
    createdAt?: DateTimeFilter<"Message"> | Date | string
    senderId?: IntFilter<"Message"> | number
    ticketId?: IntFilter<"Message"> | number
    sender?: XOR<UserScalarRelationFilter, UserWhereInput>
    ticket?: XOR<TicketScalarRelationFilter, TicketWhereInput>
    notification?: NotificationListRelationFilter
    attachments?: AttachmentsListRelationFilter
    seenBy?: MessageSeenListRelationFilter
  }, "id">

  export type MessageOrderByWithAggregationInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    senderId?: SortOrder
    ticketId?: SortOrder
    _count?: MessageCountOrderByAggregateInput
    _avg?: MessageAvgOrderByAggregateInput
    _max?: MessageMaxOrderByAggregateInput
    _min?: MessageMinOrderByAggregateInput
    _sum?: MessageSumOrderByAggregateInput
  }

  export type MessageScalarWhereWithAggregatesInput = {
    AND?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    OR?: MessageScalarWhereWithAggregatesInput[]
    NOT?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Message"> | number
    content?: StringWithAggregatesFilter<"Message"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Message"> | Date | string
    senderId?: IntWithAggregatesFilter<"Message"> | number
    ticketId?: IntWithAggregatesFilter<"Message"> | number
  }

  export type MessageSeenWhereInput = {
    AND?: MessageSeenWhereInput | MessageSeenWhereInput[]
    OR?: MessageSeenWhereInput[]
    NOT?: MessageSeenWhereInput | MessageSeenWhereInput[]
    id?: IntFilter<"MessageSeen"> | number
    seenAt?: DateTimeFilter<"MessageSeen"> | Date | string
    messageId?: IntFilter<"MessageSeen"> | number
    userId?: IntFilter<"MessageSeen"> | number
    message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type MessageSeenOrderByWithRelationInput = {
    id?: SortOrder
    seenAt?: SortOrder
    messageId?: SortOrder
    userId?: SortOrder
    message?: MessageOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type MessageSeenWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    messageId_userId?: MessageSeenMessageIdUserIdCompoundUniqueInput
    AND?: MessageSeenWhereInput | MessageSeenWhereInput[]
    OR?: MessageSeenWhereInput[]
    NOT?: MessageSeenWhereInput | MessageSeenWhereInput[]
    seenAt?: DateTimeFilter<"MessageSeen"> | Date | string
    messageId?: IntFilter<"MessageSeen"> | number
    userId?: IntFilter<"MessageSeen"> | number
    message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "messageId_userId">

  export type MessageSeenOrderByWithAggregationInput = {
    id?: SortOrder
    seenAt?: SortOrder
    messageId?: SortOrder
    userId?: SortOrder
    _count?: MessageSeenCountOrderByAggregateInput
    _avg?: MessageSeenAvgOrderByAggregateInput
    _max?: MessageSeenMaxOrderByAggregateInput
    _min?: MessageSeenMinOrderByAggregateInput
    _sum?: MessageSeenSumOrderByAggregateInput
  }

  export type MessageSeenScalarWhereWithAggregatesInput = {
    AND?: MessageSeenScalarWhereWithAggregatesInput | MessageSeenScalarWhereWithAggregatesInput[]
    OR?: MessageSeenScalarWhereWithAggregatesInput[]
    NOT?: MessageSeenScalarWhereWithAggregatesInput | MessageSeenScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"MessageSeen"> | number
    seenAt?: DateTimeWithAggregatesFilter<"MessageSeen"> | Date | string
    messageId?: IntWithAggregatesFilter<"MessageSeen"> | number
    userId?: IntWithAggregatesFilter<"MessageSeen"> | number
  }

  export type AttachmentsWhereInput = {
    AND?: AttachmentsWhereInput | AttachmentsWhereInput[]
    OR?: AttachmentsWhereInput[]
    NOT?: AttachmentsWhereInput | AttachmentsWhereInput[]
    id?: IntFilter<"Attachments"> | number
    fileName?: StringFilter<"Attachments"> | string
    fileType?: StringFilter<"Attachments"> | string
    fileSize?: IntFilter<"Attachments"> | number
    fileUrl?: StringFilter<"Attachments"> | string
    createdAt?: DateTimeFilter<"Attachments"> | Date | string
    messageId?: IntFilter<"Attachments"> | number
    message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
  }

  export type AttachmentsOrderByWithRelationInput = {
    id?: SortOrder
    fileName?: SortOrder
    fileType?: SortOrder
    fileSize?: SortOrder
    fileUrl?: SortOrder
    createdAt?: SortOrder
    messageId?: SortOrder
    message?: MessageOrderByWithRelationInput
    _relevance?: AttachmentsOrderByRelevanceInput
  }

  export type AttachmentsWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: AttachmentsWhereInput | AttachmentsWhereInput[]
    OR?: AttachmentsWhereInput[]
    NOT?: AttachmentsWhereInput | AttachmentsWhereInput[]
    fileName?: StringFilter<"Attachments"> | string
    fileType?: StringFilter<"Attachments"> | string
    fileSize?: IntFilter<"Attachments"> | number
    fileUrl?: StringFilter<"Attachments"> | string
    createdAt?: DateTimeFilter<"Attachments"> | Date | string
    messageId?: IntFilter<"Attachments"> | number
    message?: XOR<MessageScalarRelationFilter, MessageWhereInput>
  }, "id">

  export type AttachmentsOrderByWithAggregationInput = {
    id?: SortOrder
    fileName?: SortOrder
    fileType?: SortOrder
    fileSize?: SortOrder
    fileUrl?: SortOrder
    createdAt?: SortOrder
    messageId?: SortOrder
    _count?: AttachmentsCountOrderByAggregateInput
    _avg?: AttachmentsAvgOrderByAggregateInput
    _max?: AttachmentsMaxOrderByAggregateInput
    _min?: AttachmentsMinOrderByAggregateInput
    _sum?: AttachmentsSumOrderByAggregateInput
  }

  export type AttachmentsScalarWhereWithAggregatesInput = {
    AND?: AttachmentsScalarWhereWithAggregatesInput | AttachmentsScalarWhereWithAggregatesInput[]
    OR?: AttachmentsScalarWhereWithAggregatesInput[]
    NOT?: AttachmentsScalarWhereWithAggregatesInput | AttachmentsScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Attachments"> | number
    fileName?: StringWithAggregatesFilter<"Attachments"> | string
    fileType?: StringWithAggregatesFilter<"Attachments"> | string
    fileSize?: IntWithAggregatesFilter<"Attachments"> | number
    fileUrl?: StringWithAggregatesFilter<"Attachments"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Attachments"> | Date | string
    messageId?: IntWithAggregatesFilter<"Attachments"> | number
  }

  export type NotificationWhereInput = {
    AND?: NotificationWhereInput | NotificationWhereInput[]
    OR?: NotificationWhereInput[]
    NOT?: NotificationWhereInput | NotificationWhereInput[]
    id?: IntFilter<"Notification"> | number
    title?: StringFilter<"Notification"> | string
    description?: StringFilter<"Notification"> | string
    type?: StringFilter<"Notification"> | string
    createdAt?: DateTimeFilter<"Notification"> | Date | string
    createdById?: IntFilter<"Notification"> | number
    ticketId?: IntNullableFilter<"Notification"> | number | null
    messageId?: IntNullableFilter<"Notification"> | number | null
    message?: XOR<MessageNullableScalarRelationFilter, MessageWhereInput> | null
    createdBy?: XOR<UserScalarRelationFilter, UserWhereInput>
    ticket?: XOR<TicketNullableScalarRelationFilter, TicketWhereInput> | null
    recipients?: NotificationRecipientListRelationFilter
  }

  export type NotificationOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    type?: SortOrder
    createdAt?: SortOrder
    createdById?: SortOrder
    ticketId?: SortOrderInput | SortOrder
    messageId?: SortOrderInput | SortOrder
    message?: MessageOrderByWithRelationInput
    createdBy?: UserOrderByWithRelationInput
    ticket?: TicketOrderByWithRelationInput
    recipients?: NotificationRecipientOrderByRelationAggregateInput
    _relevance?: NotificationOrderByRelevanceInput
  }

  export type NotificationWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: NotificationWhereInput | NotificationWhereInput[]
    OR?: NotificationWhereInput[]
    NOT?: NotificationWhereInput | NotificationWhereInput[]
    title?: StringFilter<"Notification"> | string
    description?: StringFilter<"Notification"> | string
    type?: StringFilter<"Notification"> | string
    createdAt?: DateTimeFilter<"Notification"> | Date | string
    createdById?: IntFilter<"Notification"> | number
    ticketId?: IntNullableFilter<"Notification"> | number | null
    messageId?: IntNullableFilter<"Notification"> | number | null
    message?: XOR<MessageNullableScalarRelationFilter, MessageWhereInput> | null
    createdBy?: XOR<UserScalarRelationFilter, UserWhereInput>
    ticket?: XOR<TicketNullableScalarRelationFilter, TicketWhereInput> | null
    recipients?: NotificationRecipientListRelationFilter
  }, "id">

  export type NotificationOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    type?: SortOrder
    createdAt?: SortOrder
    createdById?: SortOrder
    ticketId?: SortOrderInput | SortOrder
    messageId?: SortOrderInput | SortOrder
    _count?: NotificationCountOrderByAggregateInput
    _avg?: NotificationAvgOrderByAggregateInput
    _max?: NotificationMaxOrderByAggregateInput
    _min?: NotificationMinOrderByAggregateInput
    _sum?: NotificationSumOrderByAggregateInput
  }

  export type NotificationScalarWhereWithAggregatesInput = {
    AND?: NotificationScalarWhereWithAggregatesInput | NotificationScalarWhereWithAggregatesInput[]
    OR?: NotificationScalarWhereWithAggregatesInput[]
    NOT?: NotificationScalarWhereWithAggregatesInput | NotificationScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Notification"> | number
    title?: StringWithAggregatesFilter<"Notification"> | string
    description?: StringWithAggregatesFilter<"Notification"> | string
    type?: StringWithAggregatesFilter<"Notification"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Notification"> | Date | string
    createdById?: IntWithAggregatesFilter<"Notification"> | number
    ticketId?: IntNullableWithAggregatesFilter<"Notification"> | number | null
    messageId?: IntNullableWithAggregatesFilter<"Notification"> | number | null
  }

  export type NotificationRecipientWhereInput = {
    AND?: NotificationRecipientWhereInput | NotificationRecipientWhereInput[]
    OR?: NotificationRecipientWhereInput[]
    NOT?: NotificationRecipientWhereInput | NotificationRecipientWhereInput[]
    id?: IntFilter<"NotificationRecipient"> | number
    notificationId?: IntFilter<"NotificationRecipient"> | number
    userId?: IntFilter<"NotificationRecipient"> | number
    seen?: BoolFilter<"NotificationRecipient"> | boolean
    seenAt?: DateTimeNullableFilter<"NotificationRecipient"> | Date | string | null
    notification?: XOR<NotificationScalarRelationFilter, NotificationWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type NotificationRecipientOrderByWithRelationInput = {
    id?: SortOrder
    notificationId?: SortOrder
    userId?: SortOrder
    seen?: SortOrder
    seenAt?: SortOrderInput | SortOrder
    notification?: NotificationOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type NotificationRecipientWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    notificationId_userId?: NotificationRecipientNotificationIdUserIdCompoundUniqueInput
    AND?: NotificationRecipientWhereInput | NotificationRecipientWhereInput[]
    OR?: NotificationRecipientWhereInput[]
    NOT?: NotificationRecipientWhereInput | NotificationRecipientWhereInput[]
    notificationId?: IntFilter<"NotificationRecipient"> | number
    userId?: IntFilter<"NotificationRecipient"> | number
    seen?: BoolFilter<"NotificationRecipient"> | boolean
    seenAt?: DateTimeNullableFilter<"NotificationRecipient"> | Date | string | null
    notification?: XOR<NotificationScalarRelationFilter, NotificationWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "notificationId_userId">

  export type NotificationRecipientOrderByWithAggregationInput = {
    id?: SortOrder
    notificationId?: SortOrder
    userId?: SortOrder
    seen?: SortOrder
    seenAt?: SortOrderInput | SortOrder
    _count?: NotificationRecipientCountOrderByAggregateInput
    _avg?: NotificationRecipientAvgOrderByAggregateInput
    _max?: NotificationRecipientMaxOrderByAggregateInput
    _min?: NotificationRecipientMinOrderByAggregateInput
    _sum?: NotificationRecipientSumOrderByAggregateInput
  }

  export type NotificationRecipientScalarWhereWithAggregatesInput = {
    AND?: NotificationRecipientScalarWhereWithAggregatesInput | NotificationRecipientScalarWhereWithAggregatesInput[]
    OR?: NotificationRecipientScalarWhereWithAggregatesInput[]
    NOT?: NotificationRecipientScalarWhereWithAggregatesInput | NotificationRecipientScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"NotificationRecipient"> | number
    notificationId?: IntWithAggregatesFilter<"NotificationRecipient"> | number
    userId?: IntWithAggregatesFilter<"NotificationRecipient"> | number
    seen?: BoolWithAggregatesFilter<"NotificationRecipient"> | boolean
    seenAt?: DateTimeNullableWithAggregatesFilter<"NotificationRecipient"> | Date | string | null
  }

  export type UserCreateInput = {
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
    createdTickets?: TicketCreateNestedManyWithoutCreatedByUserInput
    updatedTickets?: TicketCreateNestedManyWithoutUpdatedByUserInput
    messages?: MessageCreateNestedManyWithoutSenderInput
    messageSeens?: MessageSeenCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationCreateNestedManyWithoutCreatedByInput
    notificationRecipients?: NotificationRecipientCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: number
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
    createdTickets?: TicketUncheckedCreateNestedManyWithoutCreatedByUserInput
    updatedTickets?: TicketUncheckedCreateNestedManyWithoutUpdatedByUserInput
    messages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    messageSeens?: MessageSeenUncheckedCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutCreatedByInput
    notificationRecipients?: NotificationRecipientUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdTickets?: TicketUpdateManyWithoutCreatedByUserNestedInput
    updatedTickets?: TicketUpdateManyWithoutUpdatedByUserNestedInput
    messages?: MessageUpdateManyWithoutSenderNestedInput
    messageSeens?: MessageSeenUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUpdateManyWithoutCreatedByNestedInput
    notificationRecipients?: NotificationRecipientUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdTickets?: TicketUncheckedUpdateManyWithoutCreatedByUserNestedInput
    updatedTickets?: TicketUncheckedUpdateManyWithoutUpdatedByUserNestedInput
    messages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    messageSeens?: MessageSeenUncheckedUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutCreatedByNestedInput
    notificationRecipients?: NotificationRecipientUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: number
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
  }

  export type UserUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type UserUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TicketCreateInput = {
    ticketCode: string
    description: string
    customerName: string
    controllerNo: string
    head?: string | null
    imei?: string | null
    hp?: string | null
    motorType?: string | null
    state: string
    district: string
    village?: string | null
    block?: string | null
    complaintType: string
    faultCode: string
    status?: $Enums.TicketStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    createdByUser: UserCreateNestedOneWithoutCreatedTicketsInput
    updatedByUser?: UserCreateNestedOneWithoutUpdatedTicketsInput
    messages?: MessageCreateNestedManyWithoutTicketInput
    notifications?: NotificationCreateNestedManyWithoutTicketInput
  }

  export type TicketUncheckedCreateInput = {
    id?: number
    ticketCode: string
    description: string
    customerName: string
    controllerNo: string
    head?: string | null
    imei?: string | null
    hp?: string | null
    motorType?: string | null
    state: string
    district: string
    village?: string | null
    block?: string | null
    complaintType: string
    faultCode: string
    status?: $Enums.TicketStatus
    createdBy: number
    updatedBy?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    messages?: MessageUncheckedCreateNestedManyWithoutTicketInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutTicketInput
  }

  export type TicketUpdateInput = {
    ticketCode?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    controllerNo?: StringFieldUpdateOperationsInput | string
    head?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: NullableStringFieldUpdateOperationsInput | string | null
    hp?: NullableStringFieldUpdateOperationsInput | string | null
    motorType?: NullableStringFieldUpdateOperationsInput | string | null
    state?: StringFieldUpdateOperationsInput | string
    district?: StringFieldUpdateOperationsInput | string
    village?: NullableStringFieldUpdateOperationsInput | string | null
    block?: NullableStringFieldUpdateOperationsInput | string | null
    complaintType?: StringFieldUpdateOperationsInput | string
    faultCode?: StringFieldUpdateOperationsInput | string
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdByUser?: UserUpdateOneRequiredWithoutCreatedTicketsNestedInput
    updatedByUser?: UserUpdateOneWithoutUpdatedTicketsNestedInput
    messages?: MessageUpdateManyWithoutTicketNestedInput
    notifications?: NotificationUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    ticketCode?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    controllerNo?: StringFieldUpdateOperationsInput | string
    head?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: NullableStringFieldUpdateOperationsInput | string | null
    hp?: NullableStringFieldUpdateOperationsInput | string | null
    motorType?: NullableStringFieldUpdateOperationsInput | string | null
    state?: StringFieldUpdateOperationsInput | string
    district?: StringFieldUpdateOperationsInput | string
    village?: NullableStringFieldUpdateOperationsInput | string | null
    block?: NullableStringFieldUpdateOperationsInput | string | null
    complaintType?: StringFieldUpdateOperationsInput | string
    faultCode?: StringFieldUpdateOperationsInput | string
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    createdBy?: IntFieldUpdateOperationsInput | number
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: MessageUncheckedUpdateManyWithoutTicketNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutTicketNestedInput
  }

  export type TicketCreateManyInput = {
    id?: number
    ticketCode: string
    description: string
    customerName: string
    controllerNo: string
    head?: string | null
    imei?: string | null
    hp?: string | null
    motorType?: string | null
    state: string
    district: string
    village?: string | null
    block?: string | null
    complaintType: string
    faultCode: string
    status?: $Enums.TicketStatus
    createdBy: number
    updatedBy?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
  }

  export type TicketUpdateManyMutationInput = {
    ticketCode?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    controllerNo?: StringFieldUpdateOperationsInput | string
    head?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: NullableStringFieldUpdateOperationsInput | string | null
    hp?: NullableStringFieldUpdateOperationsInput | string | null
    motorType?: NullableStringFieldUpdateOperationsInput | string | null
    state?: StringFieldUpdateOperationsInput | string
    district?: StringFieldUpdateOperationsInput | string
    village?: NullableStringFieldUpdateOperationsInput | string | null
    block?: NullableStringFieldUpdateOperationsInput | string | null
    complaintType?: StringFieldUpdateOperationsInput | string
    faultCode?: StringFieldUpdateOperationsInput | string
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TicketUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    ticketCode?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    controllerNo?: StringFieldUpdateOperationsInput | string
    head?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: NullableStringFieldUpdateOperationsInput | string | null
    hp?: NullableStringFieldUpdateOperationsInput | string | null
    motorType?: NullableStringFieldUpdateOperationsInput | string | null
    state?: StringFieldUpdateOperationsInput | string
    district?: StringFieldUpdateOperationsInput | string
    village?: NullableStringFieldUpdateOperationsInput | string | null
    block?: NullableStringFieldUpdateOperationsInput | string | null
    complaintType?: StringFieldUpdateOperationsInput | string
    faultCode?: StringFieldUpdateOperationsInput | string
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    createdBy?: IntFieldUpdateOperationsInput | number
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MessageCreateInput = {
    content: string
    createdAt?: Date | string
    sender: UserCreateNestedOneWithoutMessagesInput
    ticket: TicketCreateNestedOneWithoutMessagesInput
    notification?: NotificationCreateNestedManyWithoutMessageInput
    attachments?: AttachmentsCreateNestedManyWithoutMessageInput
    seenBy?: MessageSeenCreateNestedManyWithoutMessageInput
  }

  export type MessageUncheckedCreateInput = {
    id?: number
    content: string
    createdAt?: Date | string
    senderId: number
    ticketId: number
    notification?: NotificationUncheckedCreateNestedManyWithoutMessageInput
    attachments?: AttachmentsUncheckedCreateNestedManyWithoutMessageInput
    seenBy?: MessageSeenUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageUpdateInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutMessagesNestedInput
    ticket?: TicketUpdateOneRequiredWithoutMessagesNestedInput
    notification?: NotificationUpdateManyWithoutMessageNestedInput
    attachments?: AttachmentsUpdateManyWithoutMessageNestedInput
    seenBy?: MessageSeenUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
    ticketId?: IntFieldUpdateOperationsInput | number
    notification?: NotificationUncheckedUpdateManyWithoutMessageNestedInput
    attachments?: AttachmentsUncheckedUpdateManyWithoutMessageNestedInput
    seenBy?: MessageSeenUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type MessageCreateManyInput = {
    id?: number
    content: string
    createdAt?: Date | string
    senderId: number
    ticketId: number
  }

  export type MessageUpdateManyMutationInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
    ticketId?: IntFieldUpdateOperationsInput | number
  }

  export type MessageSeenCreateInput = {
    seenAt?: Date | string
    message: MessageCreateNestedOneWithoutSeenByInput
    user: UserCreateNestedOneWithoutMessageSeensInput
  }

  export type MessageSeenUncheckedCreateInput = {
    id?: number
    seenAt?: Date | string
    messageId: number
    userId: number
  }

  export type MessageSeenUpdateInput = {
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    message?: MessageUpdateOneRequiredWithoutSeenByNestedInput
    user?: UserUpdateOneRequiredWithoutMessageSeensNestedInput
  }

  export type MessageSeenUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messageId?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
  }

  export type MessageSeenCreateManyInput = {
    id?: number
    seenAt?: Date | string
    messageId: number
    userId: number
  }

  export type MessageSeenUpdateManyMutationInput = {
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageSeenUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messageId?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
  }

  export type AttachmentsCreateInput = {
    fileName: string
    fileType: string
    fileSize: number
    fileUrl: string
    createdAt?: Date | string
    message: MessageCreateNestedOneWithoutAttachmentsInput
  }

  export type AttachmentsUncheckedCreateInput = {
    id?: number
    fileName: string
    fileType: string
    fileSize: number
    fileUrl: string
    createdAt?: Date | string
    messageId: number
  }

  export type AttachmentsUpdateInput = {
    fileName?: StringFieldUpdateOperationsInput | string
    fileType?: StringFieldUpdateOperationsInput | string
    fileSize?: IntFieldUpdateOperationsInput | number
    fileUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    message?: MessageUpdateOneRequiredWithoutAttachmentsNestedInput
  }

  export type AttachmentsUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    fileName?: StringFieldUpdateOperationsInput | string
    fileType?: StringFieldUpdateOperationsInput | string
    fileSize?: IntFieldUpdateOperationsInput | number
    fileUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messageId?: IntFieldUpdateOperationsInput | number
  }

  export type AttachmentsCreateManyInput = {
    id?: number
    fileName: string
    fileType: string
    fileSize: number
    fileUrl: string
    createdAt?: Date | string
    messageId: number
  }

  export type AttachmentsUpdateManyMutationInput = {
    fileName?: StringFieldUpdateOperationsInput | string
    fileType?: StringFieldUpdateOperationsInput | string
    fileSize?: IntFieldUpdateOperationsInput | number
    fileUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AttachmentsUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    fileName?: StringFieldUpdateOperationsInput | string
    fileType?: StringFieldUpdateOperationsInput | string
    fileSize?: IntFieldUpdateOperationsInput | number
    fileUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messageId?: IntFieldUpdateOperationsInput | number
  }

  export type NotificationCreateInput = {
    title: string
    description: string
    type: string
    createdAt?: Date | string
    message?: MessageCreateNestedOneWithoutNotificationInput
    createdBy: UserCreateNestedOneWithoutSentNotificationsInput
    ticket?: TicketCreateNestedOneWithoutNotificationsInput
    recipients?: NotificationRecipientCreateNestedManyWithoutNotificationInput
  }

  export type NotificationUncheckedCreateInput = {
    id?: number
    title: string
    description: string
    type: string
    createdAt?: Date | string
    createdById: number
    ticketId?: number | null
    messageId?: number | null
    recipients?: NotificationRecipientUncheckedCreateNestedManyWithoutNotificationInput
  }

  export type NotificationUpdateInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    message?: MessageUpdateOneWithoutNotificationNestedInput
    createdBy?: UserUpdateOneRequiredWithoutSentNotificationsNestedInput
    ticket?: TicketUpdateOneWithoutNotificationsNestedInput
    recipients?: NotificationRecipientUpdateManyWithoutNotificationNestedInput
  }

  export type NotificationUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdById?: IntFieldUpdateOperationsInput | number
    ticketId?: NullableIntFieldUpdateOperationsInput | number | null
    messageId?: NullableIntFieldUpdateOperationsInput | number | null
    recipients?: NotificationRecipientUncheckedUpdateManyWithoutNotificationNestedInput
  }

  export type NotificationCreateManyInput = {
    id?: number
    title: string
    description: string
    type: string
    createdAt?: Date | string
    createdById: number
    ticketId?: number | null
    messageId?: number | null
  }

  export type NotificationUpdateManyMutationInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdById?: IntFieldUpdateOperationsInput | number
    ticketId?: NullableIntFieldUpdateOperationsInput | number | null
    messageId?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type NotificationRecipientCreateInput = {
    seen?: boolean
    seenAt?: Date | string | null
    notification: NotificationCreateNestedOneWithoutRecipientsInput
    user: UserCreateNestedOneWithoutNotificationRecipientsInput
  }

  export type NotificationRecipientUncheckedCreateInput = {
    id?: number
    notificationId: number
    userId: number
    seen?: boolean
    seenAt?: Date | string | null
  }

  export type NotificationRecipientUpdateInput = {
    seen?: BoolFieldUpdateOperationsInput | boolean
    seenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notification?: NotificationUpdateOneRequiredWithoutRecipientsNestedInput
    user?: UserUpdateOneRequiredWithoutNotificationRecipientsNestedInput
  }

  export type NotificationRecipientUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    notificationId?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    seen?: BoolFieldUpdateOperationsInput | boolean
    seenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type NotificationRecipientCreateManyInput = {
    id?: number
    notificationId: number
    userId: number
    seen?: boolean
    seenAt?: Date | string | null
  }

  export type NotificationRecipientUpdateManyMutationInput = {
    seen?: BoolFieldUpdateOperationsInput | boolean
    seenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type NotificationRecipientUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    notificationId?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    seen?: BoolFieldUpdateOperationsInput | boolean
    seenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[]
    notIn?: $Enums.Role[]
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type TicketListRelationFilter = {
    every?: TicketWhereInput
    some?: TicketWhereInput
    none?: TicketWhereInput
  }

  export type MessageListRelationFilter = {
    every?: MessageWhereInput
    some?: MessageWhereInput
    none?: MessageWhereInput
  }

  export type MessageSeenListRelationFilter = {
    every?: MessageSeenWhereInput
    some?: MessageSeenWhereInput
    none?: MessageSeenWhereInput
  }

  export type NotificationListRelationFilter = {
    every?: NotificationWhereInput
    some?: NotificationWhereInput
    none?: NotificationWhereInput
  }

  export type NotificationRecipientListRelationFilter = {
    every?: NotificationRecipientWhereInput
    some?: NotificationRecipientWhereInput
    none?: NotificationRecipientWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type TicketOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MessageSeenOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type NotificationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type NotificationRecipientOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserOrderByRelevanceInput = {
    fields: UserOrderByRelevanceFieldEnum | UserOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    password?: SortOrder
    role?: SortOrder
    lastLogin?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    password?: SortOrder
    role?: SortOrder
    lastLogin?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    phone?: SortOrder
    password?: SortOrder
    role?: SortOrder
    lastLogin?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[]
    notIn?: $Enums.Role[]
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumTicketStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketStatus | EnumTicketStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TicketStatus[]
    notIn?: $Enums.TicketStatus[]
    not?: NestedEnumTicketStatusFilter<$PrismaModel> | $Enums.TicketStatus
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type UserNullableScalarRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type TicketOrderByRelevanceInput = {
    fields: TicketOrderByRelevanceFieldEnum | TicketOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type TicketCountOrderByAggregateInput = {
    id?: SortOrder
    ticketCode?: SortOrder
    description?: SortOrder
    customerName?: SortOrder
    controllerNo?: SortOrder
    head?: SortOrder
    imei?: SortOrder
    hp?: SortOrder
    motorType?: SortOrder
    state?: SortOrder
    district?: SortOrder
    village?: SortOrder
    block?: SortOrder
    complaintType?: SortOrder
    faultCode?: SortOrder
    status?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type TicketAvgOrderByAggregateInput = {
    id?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
  }

  export type TicketMaxOrderByAggregateInput = {
    id?: SortOrder
    ticketCode?: SortOrder
    description?: SortOrder
    customerName?: SortOrder
    controllerNo?: SortOrder
    head?: SortOrder
    imei?: SortOrder
    hp?: SortOrder
    motorType?: SortOrder
    state?: SortOrder
    district?: SortOrder
    village?: SortOrder
    block?: SortOrder
    complaintType?: SortOrder
    faultCode?: SortOrder
    status?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type TicketMinOrderByAggregateInput = {
    id?: SortOrder
    ticketCode?: SortOrder
    description?: SortOrder
    customerName?: SortOrder
    controllerNo?: SortOrder
    head?: SortOrder
    imei?: SortOrder
    hp?: SortOrder
    motorType?: SortOrder
    state?: SortOrder
    district?: SortOrder
    village?: SortOrder
    block?: SortOrder
    complaintType?: SortOrder
    faultCode?: SortOrder
    status?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type TicketSumOrderByAggregateInput = {
    id?: SortOrder
    createdBy?: SortOrder
    updatedBy?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumTicketStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketStatus | EnumTicketStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TicketStatus[]
    notIn?: $Enums.TicketStatus[]
    not?: NestedEnumTicketStatusWithAggregatesFilter<$PrismaModel> | $Enums.TicketStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTicketStatusFilter<$PrismaModel>
    _max?: NestedEnumTicketStatusFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type TicketScalarRelationFilter = {
    is?: TicketWhereInput
    isNot?: TicketWhereInput
  }

  export type AttachmentsListRelationFilter = {
    every?: AttachmentsWhereInput
    some?: AttachmentsWhereInput
    none?: AttachmentsWhereInput
  }

  export type AttachmentsOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MessageOrderByRelevanceInput = {
    fields: MessageOrderByRelevanceFieldEnum | MessageOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type MessageCountOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    senderId?: SortOrder
    ticketId?: SortOrder
  }

  export type MessageAvgOrderByAggregateInput = {
    id?: SortOrder
    senderId?: SortOrder
    ticketId?: SortOrder
  }

  export type MessageMaxOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    senderId?: SortOrder
    ticketId?: SortOrder
  }

  export type MessageMinOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    senderId?: SortOrder
    ticketId?: SortOrder
  }

  export type MessageSumOrderByAggregateInput = {
    id?: SortOrder
    senderId?: SortOrder
    ticketId?: SortOrder
  }

  export type MessageScalarRelationFilter = {
    is?: MessageWhereInput
    isNot?: MessageWhereInput
  }

  export type MessageSeenMessageIdUserIdCompoundUniqueInput = {
    messageId: number
    userId: number
  }

  export type MessageSeenCountOrderByAggregateInput = {
    id?: SortOrder
    seenAt?: SortOrder
    messageId?: SortOrder
    userId?: SortOrder
  }

  export type MessageSeenAvgOrderByAggregateInput = {
    id?: SortOrder
    messageId?: SortOrder
    userId?: SortOrder
  }

  export type MessageSeenMaxOrderByAggregateInput = {
    id?: SortOrder
    seenAt?: SortOrder
    messageId?: SortOrder
    userId?: SortOrder
  }

  export type MessageSeenMinOrderByAggregateInput = {
    id?: SortOrder
    seenAt?: SortOrder
    messageId?: SortOrder
    userId?: SortOrder
  }

  export type MessageSeenSumOrderByAggregateInput = {
    id?: SortOrder
    messageId?: SortOrder
    userId?: SortOrder
  }

  export type AttachmentsOrderByRelevanceInput = {
    fields: AttachmentsOrderByRelevanceFieldEnum | AttachmentsOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type AttachmentsCountOrderByAggregateInput = {
    id?: SortOrder
    fileName?: SortOrder
    fileType?: SortOrder
    fileSize?: SortOrder
    fileUrl?: SortOrder
    createdAt?: SortOrder
    messageId?: SortOrder
  }

  export type AttachmentsAvgOrderByAggregateInput = {
    id?: SortOrder
    fileSize?: SortOrder
    messageId?: SortOrder
  }

  export type AttachmentsMaxOrderByAggregateInput = {
    id?: SortOrder
    fileName?: SortOrder
    fileType?: SortOrder
    fileSize?: SortOrder
    fileUrl?: SortOrder
    createdAt?: SortOrder
    messageId?: SortOrder
  }

  export type AttachmentsMinOrderByAggregateInput = {
    id?: SortOrder
    fileName?: SortOrder
    fileType?: SortOrder
    fileSize?: SortOrder
    fileUrl?: SortOrder
    createdAt?: SortOrder
    messageId?: SortOrder
  }

  export type AttachmentsSumOrderByAggregateInput = {
    id?: SortOrder
    fileSize?: SortOrder
    messageId?: SortOrder
  }

  export type MessageNullableScalarRelationFilter = {
    is?: MessageWhereInput | null
    isNot?: MessageWhereInput | null
  }

  export type TicketNullableScalarRelationFilter = {
    is?: TicketWhereInput | null
    isNot?: TicketWhereInput | null
  }

  export type NotificationOrderByRelevanceInput = {
    fields: NotificationOrderByRelevanceFieldEnum | NotificationOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type NotificationCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    type?: SortOrder
    createdAt?: SortOrder
    createdById?: SortOrder
    ticketId?: SortOrder
    messageId?: SortOrder
  }

  export type NotificationAvgOrderByAggregateInput = {
    id?: SortOrder
    createdById?: SortOrder
    ticketId?: SortOrder
    messageId?: SortOrder
  }

  export type NotificationMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    type?: SortOrder
    createdAt?: SortOrder
    createdById?: SortOrder
    ticketId?: SortOrder
    messageId?: SortOrder
  }

  export type NotificationMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    type?: SortOrder
    createdAt?: SortOrder
    createdById?: SortOrder
    ticketId?: SortOrder
    messageId?: SortOrder
  }

  export type NotificationSumOrderByAggregateInput = {
    id?: SortOrder
    createdById?: SortOrder
    ticketId?: SortOrder
    messageId?: SortOrder
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NotificationScalarRelationFilter = {
    is?: NotificationWhereInput
    isNot?: NotificationWhereInput
  }

  export type NotificationRecipientNotificationIdUserIdCompoundUniqueInput = {
    notificationId: number
    userId: number
  }

  export type NotificationRecipientCountOrderByAggregateInput = {
    id?: SortOrder
    notificationId?: SortOrder
    userId?: SortOrder
    seen?: SortOrder
    seenAt?: SortOrder
  }

  export type NotificationRecipientAvgOrderByAggregateInput = {
    id?: SortOrder
    notificationId?: SortOrder
    userId?: SortOrder
  }

  export type NotificationRecipientMaxOrderByAggregateInput = {
    id?: SortOrder
    notificationId?: SortOrder
    userId?: SortOrder
    seen?: SortOrder
    seenAt?: SortOrder
  }

  export type NotificationRecipientMinOrderByAggregateInput = {
    id?: SortOrder
    notificationId?: SortOrder
    userId?: SortOrder
    seen?: SortOrder
    seenAt?: SortOrder
  }

  export type NotificationRecipientSumOrderByAggregateInput = {
    id?: SortOrder
    notificationId?: SortOrder
    userId?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type TicketCreateNestedManyWithoutCreatedByUserInput = {
    create?: XOR<TicketCreateWithoutCreatedByUserInput, TicketUncheckedCreateWithoutCreatedByUserInput> | TicketCreateWithoutCreatedByUserInput[] | TicketUncheckedCreateWithoutCreatedByUserInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutCreatedByUserInput | TicketCreateOrConnectWithoutCreatedByUserInput[]
    createMany?: TicketCreateManyCreatedByUserInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type TicketCreateNestedManyWithoutUpdatedByUserInput = {
    create?: XOR<TicketCreateWithoutUpdatedByUserInput, TicketUncheckedCreateWithoutUpdatedByUserInput> | TicketCreateWithoutUpdatedByUserInput[] | TicketUncheckedCreateWithoutUpdatedByUserInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutUpdatedByUserInput | TicketCreateOrConnectWithoutUpdatedByUserInput[]
    createMany?: TicketCreateManyUpdatedByUserInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type MessageCreateNestedManyWithoutSenderInput = {
    create?: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput> | MessageCreateWithoutSenderInput[] | MessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutSenderInput | MessageCreateOrConnectWithoutSenderInput[]
    createMany?: MessageCreateManySenderInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type MessageSeenCreateNestedManyWithoutUserInput = {
    create?: XOR<MessageSeenCreateWithoutUserInput, MessageSeenUncheckedCreateWithoutUserInput> | MessageSeenCreateWithoutUserInput[] | MessageSeenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MessageSeenCreateOrConnectWithoutUserInput | MessageSeenCreateOrConnectWithoutUserInput[]
    createMany?: MessageSeenCreateManyUserInputEnvelope
    connect?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
  }

  export type NotificationCreateNestedManyWithoutCreatedByInput = {
    create?: XOR<NotificationCreateWithoutCreatedByInput, NotificationUncheckedCreateWithoutCreatedByInput> | NotificationCreateWithoutCreatedByInput[] | NotificationUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutCreatedByInput | NotificationCreateOrConnectWithoutCreatedByInput[]
    createMany?: NotificationCreateManyCreatedByInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type NotificationRecipientCreateNestedManyWithoutUserInput = {
    create?: XOR<NotificationRecipientCreateWithoutUserInput, NotificationRecipientUncheckedCreateWithoutUserInput> | NotificationRecipientCreateWithoutUserInput[] | NotificationRecipientUncheckedCreateWithoutUserInput[]
    connectOrCreate?: NotificationRecipientCreateOrConnectWithoutUserInput | NotificationRecipientCreateOrConnectWithoutUserInput[]
    createMany?: NotificationRecipientCreateManyUserInputEnvelope
    connect?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
  }

  export type TicketUncheckedCreateNestedManyWithoutCreatedByUserInput = {
    create?: XOR<TicketCreateWithoutCreatedByUserInput, TicketUncheckedCreateWithoutCreatedByUserInput> | TicketCreateWithoutCreatedByUserInput[] | TicketUncheckedCreateWithoutCreatedByUserInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutCreatedByUserInput | TicketCreateOrConnectWithoutCreatedByUserInput[]
    createMany?: TicketCreateManyCreatedByUserInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type TicketUncheckedCreateNestedManyWithoutUpdatedByUserInput = {
    create?: XOR<TicketCreateWithoutUpdatedByUserInput, TicketUncheckedCreateWithoutUpdatedByUserInput> | TicketCreateWithoutUpdatedByUserInput[] | TicketUncheckedCreateWithoutUpdatedByUserInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutUpdatedByUserInput | TicketCreateOrConnectWithoutUpdatedByUserInput[]
    createMany?: TicketCreateManyUpdatedByUserInputEnvelope
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
  }

  export type MessageUncheckedCreateNestedManyWithoutSenderInput = {
    create?: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput> | MessageCreateWithoutSenderInput[] | MessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutSenderInput | MessageCreateOrConnectWithoutSenderInput[]
    createMany?: MessageCreateManySenderInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type MessageSeenUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<MessageSeenCreateWithoutUserInput, MessageSeenUncheckedCreateWithoutUserInput> | MessageSeenCreateWithoutUserInput[] | MessageSeenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MessageSeenCreateOrConnectWithoutUserInput | MessageSeenCreateOrConnectWithoutUserInput[]
    createMany?: MessageSeenCreateManyUserInputEnvelope
    connect?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
  }

  export type NotificationUncheckedCreateNestedManyWithoutCreatedByInput = {
    create?: XOR<NotificationCreateWithoutCreatedByInput, NotificationUncheckedCreateWithoutCreatedByInput> | NotificationCreateWithoutCreatedByInput[] | NotificationUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutCreatedByInput | NotificationCreateOrConnectWithoutCreatedByInput[]
    createMany?: NotificationCreateManyCreatedByInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type NotificationRecipientUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<NotificationRecipientCreateWithoutUserInput, NotificationRecipientUncheckedCreateWithoutUserInput> | NotificationRecipientCreateWithoutUserInput[] | NotificationRecipientUncheckedCreateWithoutUserInput[]
    connectOrCreate?: NotificationRecipientCreateOrConnectWithoutUserInput | NotificationRecipientCreateOrConnectWithoutUserInput[]
    createMany?: NotificationRecipientCreateManyUserInputEnvelope
    connect?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type TicketUpdateManyWithoutCreatedByUserNestedInput = {
    create?: XOR<TicketCreateWithoutCreatedByUserInput, TicketUncheckedCreateWithoutCreatedByUserInput> | TicketCreateWithoutCreatedByUserInput[] | TicketUncheckedCreateWithoutCreatedByUserInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutCreatedByUserInput | TicketCreateOrConnectWithoutCreatedByUserInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutCreatedByUserInput | TicketUpsertWithWhereUniqueWithoutCreatedByUserInput[]
    createMany?: TicketCreateManyCreatedByUserInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutCreatedByUserInput | TicketUpdateWithWhereUniqueWithoutCreatedByUserInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutCreatedByUserInput | TicketUpdateManyWithWhereWithoutCreatedByUserInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type TicketUpdateManyWithoutUpdatedByUserNestedInput = {
    create?: XOR<TicketCreateWithoutUpdatedByUserInput, TicketUncheckedCreateWithoutUpdatedByUserInput> | TicketCreateWithoutUpdatedByUserInput[] | TicketUncheckedCreateWithoutUpdatedByUserInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutUpdatedByUserInput | TicketCreateOrConnectWithoutUpdatedByUserInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutUpdatedByUserInput | TicketUpsertWithWhereUniqueWithoutUpdatedByUserInput[]
    createMany?: TicketCreateManyUpdatedByUserInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutUpdatedByUserInput | TicketUpdateWithWhereUniqueWithoutUpdatedByUserInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutUpdatedByUserInput | TicketUpdateManyWithWhereWithoutUpdatedByUserInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type MessageUpdateManyWithoutSenderNestedInput = {
    create?: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput> | MessageCreateWithoutSenderInput[] | MessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutSenderInput | MessageCreateOrConnectWithoutSenderInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutSenderInput | MessageUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: MessageCreateManySenderInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutSenderInput | MessageUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutSenderInput | MessageUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type MessageSeenUpdateManyWithoutUserNestedInput = {
    create?: XOR<MessageSeenCreateWithoutUserInput, MessageSeenUncheckedCreateWithoutUserInput> | MessageSeenCreateWithoutUserInput[] | MessageSeenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MessageSeenCreateOrConnectWithoutUserInput | MessageSeenCreateOrConnectWithoutUserInput[]
    upsert?: MessageSeenUpsertWithWhereUniqueWithoutUserInput | MessageSeenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: MessageSeenCreateManyUserInputEnvelope
    set?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    disconnect?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    delete?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    connect?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    update?: MessageSeenUpdateWithWhereUniqueWithoutUserInput | MessageSeenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: MessageSeenUpdateManyWithWhereWithoutUserInput | MessageSeenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: MessageSeenScalarWhereInput | MessageSeenScalarWhereInput[]
  }

  export type NotificationUpdateManyWithoutCreatedByNestedInput = {
    create?: XOR<NotificationCreateWithoutCreatedByInput, NotificationUncheckedCreateWithoutCreatedByInput> | NotificationCreateWithoutCreatedByInput[] | NotificationUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutCreatedByInput | NotificationCreateOrConnectWithoutCreatedByInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutCreatedByInput | NotificationUpsertWithWhereUniqueWithoutCreatedByInput[]
    createMany?: NotificationCreateManyCreatedByInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutCreatedByInput | NotificationUpdateWithWhereUniqueWithoutCreatedByInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutCreatedByInput | NotificationUpdateManyWithWhereWithoutCreatedByInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type NotificationRecipientUpdateManyWithoutUserNestedInput = {
    create?: XOR<NotificationRecipientCreateWithoutUserInput, NotificationRecipientUncheckedCreateWithoutUserInput> | NotificationRecipientCreateWithoutUserInput[] | NotificationRecipientUncheckedCreateWithoutUserInput[]
    connectOrCreate?: NotificationRecipientCreateOrConnectWithoutUserInput | NotificationRecipientCreateOrConnectWithoutUserInput[]
    upsert?: NotificationRecipientUpsertWithWhereUniqueWithoutUserInput | NotificationRecipientUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: NotificationRecipientCreateManyUserInputEnvelope
    set?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    disconnect?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    delete?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    connect?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    update?: NotificationRecipientUpdateWithWhereUniqueWithoutUserInput | NotificationRecipientUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: NotificationRecipientUpdateManyWithWhereWithoutUserInput | NotificationRecipientUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: NotificationRecipientScalarWhereInput | NotificationRecipientScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type TicketUncheckedUpdateManyWithoutCreatedByUserNestedInput = {
    create?: XOR<TicketCreateWithoutCreatedByUserInput, TicketUncheckedCreateWithoutCreatedByUserInput> | TicketCreateWithoutCreatedByUserInput[] | TicketUncheckedCreateWithoutCreatedByUserInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutCreatedByUserInput | TicketCreateOrConnectWithoutCreatedByUserInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutCreatedByUserInput | TicketUpsertWithWhereUniqueWithoutCreatedByUserInput[]
    createMany?: TicketCreateManyCreatedByUserInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutCreatedByUserInput | TicketUpdateWithWhereUniqueWithoutCreatedByUserInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutCreatedByUserInput | TicketUpdateManyWithWhereWithoutCreatedByUserInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type TicketUncheckedUpdateManyWithoutUpdatedByUserNestedInput = {
    create?: XOR<TicketCreateWithoutUpdatedByUserInput, TicketUncheckedCreateWithoutUpdatedByUserInput> | TicketCreateWithoutUpdatedByUserInput[] | TicketUncheckedCreateWithoutUpdatedByUserInput[]
    connectOrCreate?: TicketCreateOrConnectWithoutUpdatedByUserInput | TicketCreateOrConnectWithoutUpdatedByUserInput[]
    upsert?: TicketUpsertWithWhereUniqueWithoutUpdatedByUserInput | TicketUpsertWithWhereUniqueWithoutUpdatedByUserInput[]
    createMany?: TicketCreateManyUpdatedByUserInputEnvelope
    set?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    disconnect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    delete?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    connect?: TicketWhereUniqueInput | TicketWhereUniqueInput[]
    update?: TicketUpdateWithWhereUniqueWithoutUpdatedByUserInput | TicketUpdateWithWhereUniqueWithoutUpdatedByUserInput[]
    updateMany?: TicketUpdateManyWithWhereWithoutUpdatedByUserInput | TicketUpdateManyWithWhereWithoutUpdatedByUserInput[]
    deleteMany?: TicketScalarWhereInput | TicketScalarWhereInput[]
  }

  export type MessageUncheckedUpdateManyWithoutSenderNestedInput = {
    create?: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput> | MessageCreateWithoutSenderInput[] | MessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutSenderInput | MessageCreateOrConnectWithoutSenderInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutSenderInput | MessageUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: MessageCreateManySenderInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutSenderInput | MessageUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutSenderInput | MessageUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type MessageSeenUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<MessageSeenCreateWithoutUserInput, MessageSeenUncheckedCreateWithoutUserInput> | MessageSeenCreateWithoutUserInput[] | MessageSeenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: MessageSeenCreateOrConnectWithoutUserInput | MessageSeenCreateOrConnectWithoutUserInput[]
    upsert?: MessageSeenUpsertWithWhereUniqueWithoutUserInput | MessageSeenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: MessageSeenCreateManyUserInputEnvelope
    set?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    disconnect?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    delete?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    connect?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    update?: MessageSeenUpdateWithWhereUniqueWithoutUserInput | MessageSeenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: MessageSeenUpdateManyWithWhereWithoutUserInput | MessageSeenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: MessageSeenScalarWhereInput | MessageSeenScalarWhereInput[]
  }

  export type NotificationUncheckedUpdateManyWithoutCreatedByNestedInput = {
    create?: XOR<NotificationCreateWithoutCreatedByInput, NotificationUncheckedCreateWithoutCreatedByInput> | NotificationCreateWithoutCreatedByInput[] | NotificationUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutCreatedByInput | NotificationCreateOrConnectWithoutCreatedByInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutCreatedByInput | NotificationUpsertWithWhereUniqueWithoutCreatedByInput[]
    createMany?: NotificationCreateManyCreatedByInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutCreatedByInput | NotificationUpdateWithWhereUniqueWithoutCreatedByInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutCreatedByInput | NotificationUpdateManyWithWhereWithoutCreatedByInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type NotificationRecipientUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<NotificationRecipientCreateWithoutUserInput, NotificationRecipientUncheckedCreateWithoutUserInput> | NotificationRecipientCreateWithoutUserInput[] | NotificationRecipientUncheckedCreateWithoutUserInput[]
    connectOrCreate?: NotificationRecipientCreateOrConnectWithoutUserInput | NotificationRecipientCreateOrConnectWithoutUserInput[]
    upsert?: NotificationRecipientUpsertWithWhereUniqueWithoutUserInput | NotificationRecipientUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: NotificationRecipientCreateManyUserInputEnvelope
    set?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    disconnect?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    delete?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    connect?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    update?: NotificationRecipientUpdateWithWhereUniqueWithoutUserInput | NotificationRecipientUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: NotificationRecipientUpdateManyWithWhereWithoutUserInput | NotificationRecipientUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: NotificationRecipientScalarWhereInput | NotificationRecipientScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutCreatedTicketsInput = {
    create?: XOR<UserCreateWithoutCreatedTicketsInput, UserUncheckedCreateWithoutCreatedTicketsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCreatedTicketsInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutUpdatedTicketsInput = {
    create?: XOR<UserCreateWithoutUpdatedTicketsInput, UserUncheckedCreateWithoutUpdatedTicketsInput>
    connectOrCreate?: UserCreateOrConnectWithoutUpdatedTicketsInput
    connect?: UserWhereUniqueInput
  }

  export type MessageCreateNestedManyWithoutTicketInput = {
    create?: XOR<MessageCreateWithoutTicketInput, MessageUncheckedCreateWithoutTicketInput> | MessageCreateWithoutTicketInput[] | MessageUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutTicketInput | MessageCreateOrConnectWithoutTicketInput[]
    createMany?: MessageCreateManyTicketInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type NotificationCreateNestedManyWithoutTicketInput = {
    create?: XOR<NotificationCreateWithoutTicketInput, NotificationUncheckedCreateWithoutTicketInput> | NotificationCreateWithoutTicketInput[] | NotificationUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutTicketInput | NotificationCreateOrConnectWithoutTicketInput[]
    createMany?: NotificationCreateManyTicketInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type MessageUncheckedCreateNestedManyWithoutTicketInput = {
    create?: XOR<MessageCreateWithoutTicketInput, MessageUncheckedCreateWithoutTicketInput> | MessageCreateWithoutTicketInput[] | MessageUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutTicketInput | MessageCreateOrConnectWithoutTicketInput[]
    createMany?: MessageCreateManyTicketInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type NotificationUncheckedCreateNestedManyWithoutTicketInput = {
    create?: XOR<NotificationCreateWithoutTicketInput, NotificationUncheckedCreateWithoutTicketInput> | NotificationCreateWithoutTicketInput[] | NotificationUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutTicketInput | NotificationCreateOrConnectWithoutTicketInput[]
    createMany?: NotificationCreateManyTicketInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumTicketStatusFieldUpdateOperationsInput = {
    set?: $Enums.TicketStatus
  }

  export type UserUpdateOneRequiredWithoutCreatedTicketsNestedInput = {
    create?: XOR<UserCreateWithoutCreatedTicketsInput, UserUncheckedCreateWithoutCreatedTicketsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCreatedTicketsInput
    upsert?: UserUpsertWithoutCreatedTicketsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCreatedTicketsInput, UserUpdateWithoutCreatedTicketsInput>, UserUncheckedUpdateWithoutCreatedTicketsInput>
  }

  export type UserUpdateOneWithoutUpdatedTicketsNestedInput = {
    create?: XOR<UserCreateWithoutUpdatedTicketsInput, UserUncheckedCreateWithoutUpdatedTicketsInput>
    connectOrCreate?: UserCreateOrConnectWithoutUpdatedTicketsInput
    upsert?: UserUpsertWithoutUpdatedTicketsInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutUpdatedTicketsInput, UserUpdateWithoutUpdatedTicketsInput>, UserUncheckedUpdateWithoutUpdatedTicketsInput>
  }

  export type MessageUpdateManyWithoutTicketNestedInput = {
    create?: XOR<MessageCreateWithoutTicketInput, MessageUncheckedCreateWithoutTicketInput> | MessageCreateWithoutTicketInput[] | MessageUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutTicketInput | MessageCreateOrConnectWithoutTicketInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutTicketInput | MessageUpsertWithWhereUniqueWithoutTicketInput[]
    createMany?: MessageCreateManyTicketInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutTicketInput | MessageUpdateWithWhereUniqueWithoutTicketInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutTicketInput | MessageUpdateManyWithWhereWithoutTicketInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type NotificationUpdateManyWithoutTicketNestedInput = {
    create?: XOR<NotificationCreateWithoutTicketInput, NotificationUncheckedCreateWithoutTicketInput> | NotificationCreateWithoutTicketInput[] | NotificationUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutTicketInput | NotificationCreateOrConnectWithoutTicketInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutTicketInput | NotificationUpsertWithWhereUniqueWithoutTicketInput[]
    createMany?: NotificationCreateManyTicketInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutTicketInput | NotificationUpdateWithWhereUniqueWithoutTicketInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutTicketInput | NotificationUpdateManyWithWhereWithoutTicketInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type MessageUncheckedUpdateManyWithoutTicketNestedInput = {
    create?: XOR<MessageCreateWithoutTicketInput, MessageUncheckedCreateWithoutTicketInput> | MessageCreateWithoutTicketInput[] | MessageUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutTicketInput | MessageCreateOrConnectWithoutTicketInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutTicketInput | MessageUpsertWithWhereUniqueWithoutTicketInput[]
    createMany?: MessageCreateManyTicketInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutTicketInput | MessageUpdateWithWhereUniqueWithoutTicketInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutTicketInput | MessageUpdateManyWithWhereWithoutTicketInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type NotificationUncheckedUpdateManyWithoutTicketNestedInput = {
    create?: XOR<NotificationCreateWithoutTicketInput, NotificationUncheckedCreateWithoutTicketInput> | NotificationCreateWithoutTicketInput[] | NotificationUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutTicketInput | NotificationCreateOrConnectWithoutTicketInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutTicketInput | NotificationUpsertWithWhereUniqueWithoutTicketInput[]
    createMany?: NotificationCreateManyTicketInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutTicketInput | NotificationUpdateWithWhereUniqueWithoutTicketInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutTicketInput | NotificationUpdateManyWithWhereWithoutTicketInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutMessagesInput = {
    create?: XOR<UserCreateWithoutMessagesInput, UserUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutMessagesInput
    connect?: UserWhereUniqueInput
  }

  export type TicketCreateNestedOneWithoutMessagesInput = {
    create?: XOR<TicketCreateWithoutMessagesInput, TicketUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: TicketCreateOrConnectWithoutMessagesInput
    connect?: TicketWhereUniqueInput
  }

  export type NotificationCreateNestedManyWithoutMessageInput = {
    create?: XOR<NotificationCreateWithoutMessageInput, NotificationUncheckedCreateWithoutMessageInput> | NotificationCreateWithoutMessageInput[] | NotificationUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutMessageInput | NotificationCreateOrConnectWithoutMessageInput[]
    createMany?: NotificationCreateManyMessageInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type AttachmentsCreateNestedManyWithoutMessageInput = {
    create?: XOR<AttachmentsCreateWithoutMessageInput, AttachmentsUncheckedCreateWithoutMessageInput> | AttachmentsCreateWithoutMessageInput[] | AttachmentsUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: AttachmentsCreateOrConnectWithoutMessageInput | AttachmentsCreateOrConnectWithoutMessageInput[]
    createMany?: AttachmentsCreateManyMessageInputEnvelope
    connect?: AttachmentsWhereUniqueInput | AttachmentsWhereUniqueInput[]
  }

  export type MessageSeenCreateNestedManyWithoutMessageInput = {
    create?: XOR<MessageSeenCreateWithoutMessageInput, MessageSeenUncheckedCreateWithoutMessageInput> | MessageSeenCreateWithoutMessageInput[] | MessageSeenUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: MessageSeenCreateOrConnectWithoutMessageInput | MessageSeenCreateOrConnectWithoutMessageInput[]
    createMany?: MessageSeenCreateManyMessageInputEnvelope
    connect?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
  }

  export type NotificationUncheckedCreateNestedManyWithoutMessageInput = {
    create?: XOR<NotificationCreateWithoutMessageInput, NotificationUncheckedCreateWithoutMessageInput> | NotificationCreateWithoutMessageInput[] | NotificationUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutMessageInput | NotificationCreateOrConnectWithoutMessageInput[]
    createMany?: NotificationCreateManyMessageInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type AttachmentsUncheckedCreateNestedManyWithoutMessageInput = {
    create?: XOR<AttachmentsCreateWithoutMessageInput, AttachmentsUncheckedCreateWithoutMessageInput> | AttachmentsCreateWithoutMessageInput[] | AttachmentsUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: AttachmentsCreateOrConnectWithoutMessageInput | AttachmentsCreateOrConnectWithoutMessageInput[]
    createMany?: AttachmentsCreateManyMessageInputEnvelope
    connect?: AttachmentsWhereUniqueInput | AttachmentsWhereUniqueInput[]
  }

  export type MessageSeenUncheckedCreateNestedManyWithoutMessageInput = {
    create?: XOR<MessageSeenCreateWithoutMessageInput, MessageSeenUncheckedCreateWithoutMessageInput> | MessageSeenCreateWithoutMessageInput[] | MessageSeenUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: MessageSeenCreateOrConnectWithoutMessageInput | MessageSeenCreateOrConnectWithoutMessageInput[]
    createMany?: MessageSeenCreateManyMessageInputEnvelope
    connect?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<UserCreateWithoutMessagesInput, UserUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutMessagesInput
    upsert?: UserUpsertWithoutMessagesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutMessagesInput, UserUpdateWithoutMessagesInput>, UserUncheckedUpdateWithoutMessagesInput>
  }

  export type TicketUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<TicketCreateWithoutMessagesInput, TicketUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: TicketCreateOrConnectWithoutMessagesInput
    upsert?: TicketUpsertWithoutMessagesInput
    connect?: TicketWhereUniqueInput
    update?: XOR<XOR<TicketUpdateToOneWithWhereWithoutMessagesInput, TicketUpdateWithoutMessagesInput>, TicketUncheckedUpdateWithoutMessagesInput>
  }

  export type NotificationUpdateManyWithoutMessageNestedInput = {
    create?: XOR<NotificationCreateWithoutMessageInput, NotificationUncheckedCreateWithoutMessageInput> | NotificationCreateWithoutMessageInput[] | NotificationUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutMessageInput | NotificationCreateOrConnectWithoutMessageInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutMessageInput | NotificationUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: NotificationCreateManyMessageInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutMessageInput | NotificationUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutMessageInput | NotificationUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type AttachmentsUpdateManyWithoutMessageNestedInput = {
    create?: XOR<AttachmentsCreateWithoutMessageInput, AttachmentsUncheckedCreateWithoutMessageInput> | AttachmentsCreateWithoutMessageInput[] | AttachmentsUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: AttachmentsCreateOrConnectWithoutMessageInput | AttachmentsCreateOrConnectWithoutMessageInput[]
    upsert?: AttachmentsUpsertWithWhereUniqueWithoutMessageInput | AttachmentsUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: AttachmentsCreateManyMessageInputEnvelope
    set?: AttachmentsWhereUniqueInput | AttachmentsWhereUniqueInput[]
    disconnect?: AttachmentsWhereUniqueInput | AttachmentsWhereUniqueInput[]
    delete?: AttachmentsWhereUniqueInput | AttachmentsWhereUniqueInput[]
    connect?: AttachmentsWhereUniqueInput | AttachmentsWhereUniqueInput[]
    update?: AttachmentsUpdateWithWhereUniqueWithoutMessageInput | AttachmentsUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: AttachmentsUpdateManyWithWhereWithoutMessageInput | AttachmentsUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: AttachmentsScalarWhereInput | AttachmentsScalarWhereInput[]
  }

  export type MessageSeenUpdateManyWithoutMessageNestedInput = {
    create?: XOR<MessageSeenCreateWithoutMessageInput, MessageSeenUncheckedCreateWithoutMessageInput> | MessageSeenCreateWithoutMessageInput[] | MessageSeenUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: MessageSeenCreateOrConnectWithoutMessageInput | MessageSeenCreateOrConnectWithoutMessageInput[]
    upsert?: MessageSeenUpsertWithWhereUniqueWithoutMessageInput | MessageSeenUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: MessageSeenCreateManyMessageInputEnvelope
    set?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    disconnect?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    delete?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    connect?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    update?: MessageSeenUpdateWithWhereUniqueWithoutMessageInput | MessageSeenUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: MessageSeenUpdateManyWithWhereWithoutMessageInput | MessageSeenUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: MessageSeenScalarWhereInput | MessageSeenScalarWhereInput[]
  }

  export type NotificationUncheckedUpdateManyWithoutMessageNestedInput = {
    create?: XOR<NotificationCreateWithoutMessageInput, NotificationUncheckedCreateWithoutMessageInput> | NotificationCreateWithoutMessageInput[] | NotificationUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutMessageInput | NotificationCreateOrConnectWithoutMessageInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutMessageInput | NotificationUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: NotificationCreateManyMessageInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutMessageInput | NotificationUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutMessageInput | NotificationUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type AttachmentsUncheckedUpdateManyWithoutMessageNestedInput = {
    create?: XOR<AttachmentsCreateWithoutMessageInput, AttachmentsUncheckedCreateWithoutMessageInput> | AttachmentsCreateWithoutMessageInput[] | AttachmentsUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: AttachmentsCreateOrConnectWithoutMessageInput | AttachmentsCreateOrConnectWithoutMessageInput[]
    upsert?: AttachmentsUpsertWithWhereUniqueWithoutMessageInput | AttachmentsUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: AttachmentsCreateManyMessageInputEnvelope
    set?: AttachmentsWhereUniqueInput | AttachmentsWhereUniqueInput[]
    disconnect?: AttachmentsWhereUniqueInput | AttachmentsWhereUniqueInput[]
    delete?: AttachmentsWhereUniqueInput | AttachmentsWhereUniqueInput[]
    connect?: AttachmentsWhereUniqueInput | AttachmentsWhereUniqueInput[]
    update?: AttachmentsUpdateWithWhereUniqueWithoutMessageInput | AttachmentsUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: AttachmentsUpdateManyWithWhereWithoutMessageInput | AttachmentsUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: AttachmentsScalarWhereInput | AttachmentsScalarWhereInput[]
  }

  export type MessageSeenUncheckedUpdateManyWithoutMessageNestedInput = {
    create?: XOR<MessageSeenCreateWithoutMessageInput, MessageSeenUncheckedCreateWithoutMessageInput> | MessageSeenCreateWithoutMessageInput[] | MessageSeenUncheckedCreateWithoutMessageInput[]
    connectOrCreate?: MessageSeenCreateOrConnectWithoutMessageInput | MessageSeenCreateOrConnectWithoutMessageInput[]
    upsert?: MessageSeenUpsertWithWhereUniqueWithoutMessageInput | MessageSeenUpsertWithWhereUniqueWithoutMessageInput[]
    createMany?: MessageSeenCreateManyMessageInputEnvelope
    set?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    disconnect?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    delete?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    connect?: MessageSeenWhereUniqueInput | MessageSeenWhereUniqueInput[]
    update?: MessageSeenUpdateWithWhereUniqueWithoutMessageInput | MessageSeenUpdateWithWhereUniqueWithoutMessageInput[]
    updateMany?: MessageSeenUpdateManyWithWhereWithoutMessageInput | MessageSeenUpdateManyWithWhereWithoutMessageInput[]
    deleteMany?: MessageSeenScalarWhereInput | MessageSeenScalarWhereInput[]
  }

  export type MessageCreateNestedOneWithoutSeenByInput = {
    create?: XOR<MessageCreateWithoutSeenByInput, MessageUncheckedCreateWithoutSeenByInput>
    connectOrCreate?: MessageCreateOrConnectWithoutSeenByInput
    connect?: MessageWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutMessageSeensInput = {
    create?: XOR<UserCreateWithoutMessageSeensInput, UserUncheckedCreateWithoutMessageSeensInput>
    connectOrCreate?: UserCreateOrConnectWithoutMessageSeensInput
    connect?: UserWhereUniqueInput
  }

  export type MessageUpdateOneRequiredWithoutSeenByNestedInput = {
    create?: XOR<MessageCreateWithoutSeenByInput, MessageUncheckedCreateWithoutSeenByInput>
    connectOrCreate?: MessageCreateOrConnectWithoutSeenByInput
    upsert?: MessageUpsertWithoutSeenByInput
    connect?: MessageWhereUniqueInput
    update?: XOR<XOR<MessageUpdateToOneWithWhereWithoutSeenByInput, MessageUpdateWithoutSeenByInput>, MessageUncheckedUpdateWithoutSeenByInput>
  }

  export type UserUpdateOneRequiredWithoutMessageSeensNestedInput = {
    create?: XOR<UserCreateWithoutMessageSeensInput, UserUncheckedCreateWithoutMessageSeensInput>
    connectOrCreate?: UserCreateOrConnectWithoutMessageSeensInput
    upsert?: UserUpsertWithoutMessageSeensInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutMessageSeensInput, UserUpdateWithoutMessageSeensInput>, UserUncheckedUpdateWithoutMessageSeensInput>
  }

  export type MessageCreateNestedOneWithoutAttachmentsInput = {
    create?: XOR<MessageCreateWithoutAttachmentsInput, MessageUncheckedCreateWithoutAttachmentsInput>
    connectOrCreate?: MessageCreateOrConnectWithoutAttachmentsInput
    connect?: MessageWhereUniqueInput
  }

  export type MessageUpdateOneRequiredWithoutAttachmentsNestedInput = {
    create?: XOR<MessageCreateWithoutAttachmentsInput, MessageUncheckedCreateWithoutAttachmentsInput>
    connectOrCreate?: MessageCreateOrConnectWithoutAttachmentsInput
    upsert?: MessageUpsertWithoutAttachmentsInput
    connect?: MessageWhereUniqueInput
    update?: XOR<XOR<MessageUpdateToOneWithWhereWithoutAttachmentsInput, MessageUpdateWithoutAttachmentsInput>, MessageUncheckedUpdateWithoutAttachmentsInput>
  }

  export type MessageCreateNestedOneWithoutNotificationInput = {
    create?: XOR<MessageCreateWithoutNotificationInput, MessageUncheckedCreateWithoutNotificationInput>
    connectOrCreate?: MessageCreateOrConnectWithoutNotificationInput
    connect?: MessageWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutSentNotificationsInput = {
    create?: XOR<UserCreateWithoutSentNotificationsInput, UserUncheckedCreateWithoutSentNotificationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSentNotificationsInput
    connect?: UserWhereUniqueInput
  }

  export type TicketCreateNestedOneWithoutNotificationsInput = {
    create?: XOR<TicketCreateWithoutNotificationsInput, TicketUncheckedCreateWithoutNotificationsInput>
    connectOrCreate?: TicketCreateOrConnectWithoutNotificationsInput
    connect?: TicketWhereUniqueInput
  }

  export type NotificationRecipientCreateNestedManyWithoutNotificationInput = {
    create?: XOR<NotificationRecipientCreateWithoutNotificationInput, NotificationRecipientUncheckedCreateWithoutNotificationInput> | NotificationRecipientCreateWithoutNotificationInput[] | NotificationRecipientUncheckedCreateWithoutNotificationInput[]
    connectOrCreate?: NotificationRecipientCreateOrConnectWithoutNotificationInput | NotificationRecipientCreateOrConnectWithoutNotificationInput[]
    createMany?: NotificationRecipientCreateManyNotificationInputEnvelope
    connect?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
  }

  export type NotificationRecipientUncheckedCreateNestedManyWithoutNotificationInput = {
    create?: XOR<NotificationRecipientCreateWithoutNotificationInput, NotificationRecipientUncheckedCreateWithoutNotificationInput> | NotificationRecipientCreateWithoutNotificationInput[] | NotificationRecipientUncheckedCreateWithoutNotificationInput[]
    connectOrCreate?: NotificationRecipientCreateOrConnectWithoutNotificationInput | NotificationRecipientCreateOrConnectWithoutNotificationInput[]
    createMany?: NotificationRecipientCreateManyNotificationInputEnvelope
    connect?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
  }

  export type MessageUpdateOneWithoutNotificationNestedInput = {
    create?: XOR<MessageCreateWithoutNotificationInput, MessageUncheckedCreateWithoutNotificationInput>
    connectOrCreate?: MessageCreateOrConnectWithoutNotificationInput
    upsert?: MessageUpsertWithoutNotificationInput
    disconnect?: MessageWhereInput | boolean
    delete?: MessageWhereInput | boolean
    connect?: MessageWhereUniqueInput
    update?: XOR<XOR<MessageUpdateToOneWithWhereWithoutNotificationInput, MessageUpdateWithoutNotificationInput>, MessageUncheckedUpdateWithoutNotificationInput>
  }

  export type UserUpdateOneRequiredWithoutSentNotificationsNestedInput = {
    create?: XOR<UserCreateWithoutSentNotificationsInput, UserUncheckedCreateWithoutSentNotificationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSentNotificationsInput
    upsert?: UserUpsertWithoutSentNotificationsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSentNotificationsInput, UserUpdateWithoutSentNotificationsInput>, UserUncheckedUpdateWithoutSentNotificationsInput>
  }

  export type TicketUpdateOneWithoutNotificationsNestedInput = {
    create?: XOR<TicketCreateWithoutNotificationsInput, TicketUncheckedCreateWithoutNotificationsInput>
    connectOrCreate?: TicketCreateOrConnectWithoutNotificationsInput
    upsert?: TicketUpsertWithoutNotificationsInput
    disconnect?: TicketWhereInput | boolean
    delete?: TicketWhereInput | boolean
    connect?: TicketWhereUniqueInput
    update?: XOR<XOR<TicketUpdateToOneWithWhereWithoutNotificationsInput, TicketUpdateWithoutNotificationsInput>, TicketUncheckedUpdateWithoutNotificationsInput>
  }

  export type NotificationRecipientUpdateManyWithoutNotificationNestedInput = {
    create?: XOR<NotificationRecipientCreateWithoutNotificationInput, NotificationRecipientUncheckedCreateWithoutNotificationInput> | NotificationRecipientCreateWithoutNotificationInput[] | NotificationRecipientUncheckedCreateWithoutNotificationInput[]
    connectOrCreate?: NotificationRecipientCreateOrConnectWithoutNotificationInput | NotificationRecipientCreateOrConnectWithoutNotificationInput[]
    upsert?: NotificationRecipientUpsertWithWhereUniqueWithoutNotificationInput | NotificationRecipientUpsertWithWhereUniqueWithoutNotificationInput[]
    createMany?: NotificationRecipientCreateManyNotificationInputEnvelope
    set?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    disconnect?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    delete?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    connect?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    update?: NotificationRecipientUpdateWithWhereUniqueWithoutNotificationInput | NotificationRecipientUpdateWithWhereUniqueWithoutNotificationInput[]
    updateMany?: NotificationRecipientUpdateManyWithWhereWithoutNotificationInput | NotificationRecipientUpdateManyWithWhereWithoutNotificationInput[]
    deleteMany?: NotificationRecipientScalarWhereInput | NotificationRecipientScalarWhereInput[]
  }

  export type NotificationRecipientUncheckedUpdateManyWithoutNotificationNestedInput = {
    create?: XOR<NotificationRecipientCreateWithoutNotificationInput, NotificationRecipientUncheckedCreateWithoutNotificationInput> | NotificationRecipientCreateWithoutNotificationInput[] | NotificationRecipientUncheckedCreateWithoutNotificationInput[]
    connectOrCreate?: NotificationRecipientCreateOrConnectWithoutNotificationInput | NotificationRecipientCreateOrConnectWithoutNotificationInput[]
    upsert?: NotificationRecipientUpsertWithWhereUniqueWithoutNotificationInput | NotificationRecipientUpsertWithWhereUniqueWithoutNotificationInput[]
    createMany?: NotificationRecipientCreateManyNotificationInputEnvelope
    set?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    disconnect?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    delete?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    connect?: NotificationRecipientWhereUniqueInput | NotificationRecipientWhereUniqueInput[]
    update?: NotificationRecipientUpdateWithWhereUniqueWithoutNotificationInput | NotificationRecipientUpdateWithWhereUniqueWithoutNotificationInput[]
    updateMany?: NotificationRecipientUpdateManyWithWhereWithoutNotificationInput | NotificationRecipientUpdateManyWithWhereWithoutNotificationInput[]
    deleteMany?: NotificationRecipientScalarWhereInput | NotificationRecipientScalarWhereInput[]
  }

  export type NotificationCreateNestedOneWithoutRecipientsInput = {
    create?: XOR<NotificationCreateWithoutRecipientsInput, NotificationUncheckedCreateWithoutRecipientsInput>
    connectOrCreate?: NotificationCreateOrConnectWithoutRecipientsInput
    connect?: NotificationWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutNotificationRecipientsInput = {
    create?: XOR<UserCreateWithoutNotificationRecipientsInput, UserUncheckedCreateWithoutNotificationRecipientsInput>
    connectOrCreate?: UserCreateOrConnectWithoutNotificationRecipientsInput
    connect?: UserWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NotificationUpdateOneRequiredWithoutRecipientsNestedInput = {
    create?: XOR<NotificationCreateWithoutRecipientsInput, NotificationUncheckedCreateWithoutRecipientsInput>
    connectOrCreate?: NotificationCreateOrConnectWithoutRecipientsInput
    upsert?: NotificationUpsertWithoutRecipientsInput
    connect?: NotificationWhereUniqueInput
    update?: XOR<XOR<NotificationUpdateToOneWithWhereWithoutRecipientsInput, NotificationUpdateWithoutRecipientsInput>, NotificationUncheckedUpdateWithoutRecipientsInput>
  }

  export type UserUpdateOneRequiredWithoutNotificationRecipientsNestedInput = {
    create?: XOR<UserCreateWithoutNotificationRecipientsInput, UserUncheckedCreateWithoutNotificationRecipientsInput>
    connectOrCreate?: UserCreateOrConnectWithoutNotificationRecipientsInput
    upsert?: UserUpsertWithoutNotificationRecipientsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutNotificationRecipientsInput, UserUpdateWithoutNotificationRecipientsInput>, UserUncheckedUpdateWithoutNotificationRecipientsInput>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[]
    notIn?: $Enums.Role[]
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[]
    notIn?: $Enums.Role[]
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumTicketStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketStatus | EnumTicketStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TicketStatus[]
    notIn?: $Enums.TicketStatus[]
    not?: NestedEnumTicketStatusFilter<$PrismaModel> | $Enums.TicketStatus
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedEnumTicketStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TicketStatus | EnumTicketStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TicketStatus[]
    notIn?: $Enums.TicketStatus[]
    not?: NestedEnumTicketStatusWithAggregatesFilter<$PrismaModel> | $Enums.TicketStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTicketStatusFilter<$PrismaModel>
    _max?: NestedEnumTicketStatusFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type TicketCreateWithoutCreatedByUserInput = {
    ticketCode: string
    description: string
    customerName: string
    controllerNo: string
    head?: string | null
    imei?: string | null
    hp?: string | null
    motorType?: string | null
    state: string
    district: string
    village?: string | null
    block?: string | null
    complaintType: string
    faultCode: string
    status?: $Enums.TicketStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    updatedByUser?: UserCreateNestedOneWithoutUpdatedTicketsInput
    messages?: MessageCreateNestedManyWithoutTicketInput
    notifications?: NotificationCreateNestedManyWithoutTicketInput
  }

  export type TicketUncheckedCreateWithoutCreatedByUserInput = {
    id?: number
    ticketCode: string
    description: string
    customerName: string
    controllerNo: string
    head?: string | null
    imei?: string | null
    hp?: string | null
    motorType?: string | null
    state: string
    district: string
    village?: string | null
    block?: string | null
    complaintType: string
    faultCode: string
    status?: $Enums.TicketStatus
    updatedBy?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    messages?: MessageUncheckedCreateNestedManyWithoutTicketInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutTicketInput
  }

  export type TicketCreateOrConnectWithoutCreatedByUserInput = {
    where: TicketWhereUniqueInput
    create: XOR<TicketCreateWithoutCreatedByUserInput, TicketUncheckedCreateWithoutCreatedByUserInput>
  }

  export type TicketCreateManyCreatedByUserInputEnvelope = {
    data: TicketCreateManyCreatedByUserInput | TicketCreateManyCreatedByUserInput[]
    skipDuplicates?: boolean
  }

  export type TicketCreateWithoutUpdatedByUserInput = {
    ticketCode: string
    description: string
    customerName: string
    controllerNo: string
    head?: string | null
    imei?: string | null
    hp?: string | null
    motorType?: string | null
    state: string
    district: string
    village?: string | null
    block?: string | null
    complaintType: string
    faultCode: string
    status?: $Enums.TicketStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    createdByUser: UserCreateNestedOneWithoutCreatedTicketsInput
    messages?: MessageCreateNestedManyWithoutTicketInput
    notifications?: NotificationCreateNestedManyWithoutTicketInput
  }

  export type TicketUncheckedCreateWithoutUpdatedByUserInput = {
    id?: number
    ticketCode: string
    description: string
    customerName: string
    controllerNo: string
    head?: string | null
    imei?: string | null
    hp?: string | null
    motorType?: string | null
    state: string
    district: string
    village?: string | null
    block?: string | null
    complaintType: string
    faultCode: string
    status?: $Enums.TicketStatus
    createdBy: number
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    messages?: MessageUncheckedCreateNestedManyWithoutTicketInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutTicketInput
  }

  export type TicketCreateOrConnectWithoutUpdatedByUserInput = {
    where: TicketWhereUniqueInput
    create: XOR<TicketCreateWithoutUpdatedByUserInput, TicketUncheckedCreateWithoutUpdatedByUserInput>
  }

  export type TicketCreateManyUpdatedByUserInputEnvelope = {
    data: TicketCreateManyUpdatedByUserInput | TicketCreateManyUpdatedByUserInput[]
    skipDuplicates?: boolean
  }

  export type MessageCreateWithoutSenderInput = {
    content: string
    createdAt?: Date | string
    ticket: TicketCreateNestedOneWithoutMessagesInput
    notification?: NotificationCreateNestedManyWithoutMessageInput
    attachments?: AttachmentsCreateNestedManyWithoutMessageInput
    seenBy?: MessageSeenCreateNestedManyWithoutMessageInput
  }

  export type MessageUncheckedCreateWithoutSenderInput = {
    id?: number
    content: string
    createdAt?: Date | string
    ticketId: number
    notification?: NotificationUncheckedCreateNestedManyWithoutMessageInput
    attachments?: AttachmentsUncheckedCreateNestedManyWithoutMessageInput
    seenBy?: MessageSeenUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageCreateOrConnectWithoutSenderInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput>
  }

  export type MessageCreateManySenderInputEnvelope = {
    data: MessageCreateManySenderInput | MessageCreateManySenderInput[]
    skipDuplicates?: boolean
  }

  export type MessageSeenCreateWithoutUserInput = {
    seenAt?: Date | string
    message: MessageCreateNestedOneWithoutSeenByInput
  }

  export type MessageSeenUncheckedCreateWithoutUserInput = {
    id?: number
    seenAt?: Date | string
    messageId: number
  }

  export type MessageSeenCreateOrConnectWithoutUserInput = {
    where: MessageSeenWhereUniqueInput
    create: XOR<MessageSeenCreateWithoutUserInput, MessageSeenUncheckedCreateWithoutUserInput>
  }

  export type MessageSeenCreateManyUserInputEnvelope = {
    data: MessageSeenCreateManyUserInput | MessageSeenCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type NotificationCreateWithoutCreatedByInput = {
    title: string
    description: string
    type: string
    createdAt?: Date | string
    message?: MessageCreateNestedOneWithoutNotificationInput
    ticket?: TicketCreateNestedOneWithoutNotificationsInput
    recipients?: NotificationRecipientCreateNestedManyWithoutNotificationInput
  }

  export type NotificationUncheckedCreateWithoutCreatedByInput = {
    id?: number
    title: string
    description: string
    type: string
    createdAt?: Date | string
    ticketId?: number | null
    messageId?: number | null
    recipients?: NotificationRecipientUncheckedCreateNestedManyWithoutNotificationInput
  }

  export type NotificationCreateOrConnectWithoutCreatedByInput = {
    where: NotificationWhereUniqueInput
    create: XOR<NotificationCreateWithoutCreatedByInput, NotificationUncheckedCreateWithoutCreatedByInput>
  }

  export type NotificationCreateManyCreatedByInputEnvelope = {
    data: NotificationCreateManyCreatedByInput | NotificationCreateManyCreatedByInput[]
    skipDuplicates?: boolean
  }

  export type NotificationRecipientCreateWithoutUserInput = {
    seen?: boolean
    seenAt?: Date | string | null
    notification: NotificationCreateNestedOneWithoutRecipientsInput
  }

  export type NotificationRecipientUncheckedCreateWithoutUserInput = {
    id?: number
    notificationId: number
    seen?: boolean
    seenAt?: Date | string | null
  }

  export type NotificationRecipientCreateOrConnectWithoutUserInput = {
    where: NotificationRecipientWhereUniqueInput
    create: XOR<NotificationRecipientCreateWithoutUserInput, NotificationRecipientUncheckedCreateWithoutUserInput>
  }

  export type NotificationRecipientCreateManyUserInputEnvelope = {
    data: NotificationRecipientCreateManyUserInput | NotificationRecipientCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type TicketUpsertWithWhereUniqueWithoutCreatedByUserInput = {
    where: TicketWhereUniqueInput
    update: XOR<TicketUpdateWithoutCreatedByUserInput, TicketUncheckedUpdateWithoutCreatedByUserInput>
    create: XOR<TicketCreateWithoutCreatedByUserInput, TicketUncheckedCreateWithoutCreatedByUserInput>
  }

  export type TicketUpdateWithWhereUniqueWithoutCreatedByUserInput = {
    where: TicketWhereUniqueInput
    data: XOR<TicketUpdateWithoutCreatedByUserInput, TicketUncheckedUpdateWithoutCreatedByUserInput>
  }

  export type TicketUpdateManyWithWhereWithoutCreatedByUserInput = {
    where: TicketScalarWhereInput
    data: XOR<TicketUpdateManyMutationInput, TicketUncheckedUpdateManyWithoutCreatedByUserInput>
  }

  export type TicketScalarWhereInput = {
    AND?: TicketScalarWhereInput | TicketScalarWhereInput[]
    OR?: TicketScalarWhereInput[]
    NOT?: TicketScalarWhereInput | TicketScalarWhereInput[]
    id?: IntFilter<"Ticket"> | number
    ticketCode?: StringFilter<"Ticket"> | string
    description?: StringFilter<"Ticket"> | string
    customerName?: StringFilter<"Ticket"> | string
    controllerNo?: StringFilter<"Ticket"> | string
    head?: StringNullableFilter<"Ticket"> | string | null
    imei?: StringNullableFilter<"Ticket"> | string | null
    hp?: StringNullableFilter<"Ticket"> | string | null
    motorType?: StringNullableFilter<"Ticket"> | string | null
    state?: StringFilter<"Ticket"> | string
    district?: StringFilter<"Ticket"> | string
    village?: StringNullableFilter<"Ticket"> | string | null
    block?: StringNullableFilter<"Ticket"> | string | null
    complaintType?: StringFilter<"Ticket"> | string
    faultCode?: StringFilter<"Ticket"> | string
    status?: EnumTicketStatusFilter<"Ticket"> | $Enums.TicketStatus
    createdBy?: IntFilter<"Ticket"> | number
    updatedBy?: IntNullableFilter<"Ticket"> | number | null
    createdAt?: DateTimeFilter<"Ticket"> | Date | string
    updatedAt?: DateTimeFilter<"Ticket"> | Date | string
    deletedAt?: DateTimeNullableFilter<"Ticket"> | Date | string | null
  }

  export type TicketUpsertWithWhereUniqueWithoutUpdatedByUserInput = {
    where: TicketWhereUniqueInput
    update: XOR<TicketUpdateWithoutUpdatedByUserInput, TicketUncheckedUpdateWithoutUpdatedByUserInput>
    create: XOR<TicketCreateWithoutUpdatedByUserInput, TicketUncheckedCreateWithoutUpdatedByUserInput>
  }

  export type TicketUpdateWithWhereUniqueWithoutUpdatedByUserInput = {
    where: TicketWhereUniqueInput
    data: XOR<TicketUpdateWithoutUpdatedByUserInput, TicketUncheckedUpdateWithoutUpdatedByUserInput>
  }

  export type TicketUpdateManyWithWhereWithoutUpdatedByUserInput = {
    where: TicketScalarWhereInput
    data: XOR<TicketUpdateManyMutationInput, TicketUncheckedUpdateManyWithoutUpdatedByUserInput>
  }

  export type MessageUpsertWithWhereUniqueWithoutSenderInput = {
    where: MessageWhereUniqueInput
    update: XOR<MessageUpdateWithoutSenderInput, MessageUncheckedUpdateWithoutSenderInput>
    create: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput>
  }

  export type MessageUpdateWithWhereUniqueWithoutSenderInput = {
    where: MessageWhereUniqueInput
    data: XOR<MessageUpdateWithoutSenderInput, MessageUncheckedUpdateWithoutSenderInput>
  }

  export type MessageUpdateManyWithWhereWithoutSenderInput = {
    where: MessageScalarWhereInput
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyWithoutSenderInput>
  }

  export type MessageScalarWhereInput = {
    AND?: MessageScalarWhereInput | MessageScalarWhereInput[]
    OR?: MessageScalarWhereInput[]
    NOT?: MessageScalarWhereInput | MessageScalarWhereInput[]
    id?: IntFilter<"Message"> | number
    content?: StringFilter<"Message"> | string
    createdAt?: DateTimeFilter<"Message"> | Date | string
    senderId?: IntFilter<"Message"> | number
    ticketId?: IntFilter<"Message"> | number
  }

  export type MessageSeenUpsertWithWhereUniqueWithoutUserInput = {
    where: MessageSeenWhereUniqueInput
    update: XOR<MessageSeenUpdateWithoutUserInput, MessageSeenUncheckedUpdateWithoutUserInput>
    create: XOR<MessageSeenCreateWithoutUserInput, MessageSeenUncheckedCreateWithoutUserInput>
  }

  export type MessageSeenUpdateWithWhereUniqueWithoutUserInput = {
    where: MessageSeenWhereUniqueInput
    data: XOR<MessageSeenUpdateWithoutUserInput, MessageSeenUncheckedUpdateWithoutUserInput>
  }

  export type MessageSeenUpdateManyWithWhereWithoutUserInput = {
    where: MessageSeenScalarWhereInput
    data: XOR<MessageSeenUpdateManyMutationInput, MessageSeenUncheckedUpdateManyWithoutUserInput>
  }

  export type MessageSeenScalarWhereInput = {
    AND?: MessageSeenScalarWhereInput | MessageSeenScalarWhereInput[]
    OR?: MessageSeenScalarWhereInput[]
    NOT?: MessageSeenScalarWhereInput | MessageSeenScalarWhereInput[]
    id?: IntFilter<"MessageSeen"> | number
    seenAt?: DateTimeFilter<"MessageSeen"> | Date | string
    messageId?: IntFilter<"MessageSeen"> | number
    userId?: IntFilter<"MessageSeen"> | number
  }

  export type NotificationUpsertWithWhereUniqueWithoutCreatedByInput = {
    where: NotificationWhereUniqueInput
    update: XOR<NotificationUpdateWithoutCreatedByInput, NotificationUncheckedUpdateWithoutCreatedByInput>
    create: XOR<NotificationCreateWithoutCreatedByInput, NotificationUncheckedCreateWithoutCreatedByInput>
  }

  export type NotificationUpdateWithWhereUniqueWithoutCreatedByInput = {
    where: NotificationWhereUniqueInput
    data: XOR<NotificationUpdateWithoutCreatedByInput, NotificationUncheckedUpdateWithoutCreatedByInput>
  }

  export type NotificationUpdateManyWithWhereWithoutCreatedByInput = {
    where: NotificationScalarWhereInput
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyWithoutCreatedByInput>
  }

  export type NotificationScalarWhereInput = {
    AND?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
    OR?: NotificationScalarWhereInput[]
    NOT?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
    id?: IntFilter<"Notification"> | number
    title?: StringFilter<"Notification"> | string
    description?: StringFilter<"Notification"> | string
    type?: StringFilter<"Notification"> | string
    createdAt?: DateTimeFilter<"Notification"> | Date | string
    createdById?: IntFilter<"Notification"> | number
    ticketId?: IntNullableFilter<"Notification"> | number | null
    messageId?: IntNullableFilter<"Notification"> | number | null
  }

  export type NotificationRecipientUpsertWithWhereUniqueWithoutUserInput = {
    where: NotificationRecipientWhereUniqueInput
    update: XOR<NotificationRecipientUpdateWithoutUserInput, NotificationRecipientUncheckedUpdateWithoutUserInput>
    create: XOR<NotificationRecipientCreateWithoutUserInput, NotificationRecipientUncheckedCreateWithoutUserInput>
  }

  export type NotificationRecipientUpdateWithWhereUniqueWithoutUserInput = {
    where: NotificationRecipientWhereUniqueInput
    data: XOR<NotificationRecipientUpdateWithoutUserInput, NotificationRecipientUncheckedUpdateWithoutUserInput>
  }

  export type NotificationRecipientUpdateManyWithWhereWithoutUserInput = {
    where: NotificationRecipientScalarWhereInput
    data: XOR<NotificationRecipientUpdateManyMutationInput, NotificationRecipientUncheckedUpdateManyWithoutUserInput>
  }

  export type NotificationRecipientScalarWhereInput = {
    AND?: NotificationRecipientScalarWhereInput | NotificationRecipientScalarWhereInput[]
    OR?: NotificationRecipientScalarWhereInput[]
    NOT?: NotificationRecipientScalarWhereInput | NotificationRecipientScalarWhereInput[]
    id?: IntFilter<"NotificationRecipient"> | number
    notificationId?: IntFilter<"NotificationRecipient"> | number
    userId?: IntFilter<"NotificationRecipient"> | number
    seen?: BoolFilter<"NotificationRecipient"> | boolean
    seenAt?: DateTimeNullableFilter<"NotificationRecipient"> | Date | string | null
  }

  export type UserCreateWithoutCreatedTicketsInput = {
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
    updatedTickets?: TicketCreateNestedManyWithoutUpdatedByUserInput
    messages?: MessageCreateNestedManyWithoutSenderInput
    messageSeens?: MessageSeenCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationCreateNestedManyWithoutCreatedByInput
    notificationRecipients?: NotificationRecipientCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutCreatedTicketsInput = {
    id?: number
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
    updatedTickets?: TicketUncheckedCreateNestedManyWithoutUpdatedByUserInput
    messages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    messageSeens?: MessageSeenUncheckedCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutCreatedByInput
    notificationRecipients?: NotificationRecipientUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutCreatedTicketsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCreatedTicketsInput, UserUncheckedCreateWithoutCreatedTicketsInput>
  }

  export type UserCreateWithoutUpdatedTicketsInput = {
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
    createdTickets?: TicketCreateNestedManyWithoutCreatedByUserInput
    messages?: MessageCreateNestedManyWithoutSenderInput
    messageSeens?: MessageSeenCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationCreateNestedManyWithoutCreatedByInput
    notificationRecipients?: NotificationRecipientCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutUpdatedTicketsInput = {
    id?: number
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
    createdTickets?: TicketUncheckedCreateNestedManyWithoutCreatedByUserInput
    messages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    messageSeens?: MessageSeenUncheckedCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutCreatedByInput
    notificationRecipients?: NotificationRecipientUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutUpdatedTicketsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutUpdatedTicketsInput, UserUncheckedCreateWithoutUpdatedTicketsInput>
  }

  export type MessageCreateWithoutTicketInput = {
    content: string
    createdAt?: Date | string
    sender: UserCreateNestedOneWithoutMessagesInput
    notification?: NotificationCreateNestedManyWithoutMessageInput
    attachments?: AttachmentsCreateNestedManyWithoutMessageInput
    seenBy?: MessageSeenCreateNestedManyWithoutMessageInput
  }

  export type MessageUncheckedCreateWithoutTicketInput = {
    id?: number
    content: string
    createdAt?: Date | string
    senderId: number
    notification?: NotificationUncheckedCreateNestedManyWithoutMessageInput
    attachments?: AttachmentsUncheckedCreateNestedManyWithoutMessageInput
    seenBy?: MessageSeenUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageCreateOrConnectWithoutTicketInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutTicketInput, MessageUncheckedCreateWithoutTicketInput>
  }

  export type MessageCreateManyTicketInputEnvelope = {
    data: MessageCreateManyTicketInput | MessageCreateManyTicketInput[]
    skipDuplicates?: boolean
  }

  export type NotificationCreateWithoutTicketInput = {
    title: string
    description: string
    type: string
    createdAt?: Date | string
    message?: MessageCreateNestedOneWithoutNotificationInput
    createdBy: UserCreateNestedOneWithoutSentNotificationsInput
    recipients?: NotificationRecipientCreateNestedManyWithoutNotificationInput
  }

  export type NotificationUncheckedCreateWithoutTicketInput = {
    id?: number
    title: string
    description: string
    type: string
    createdAt?: Date | string
    createdById: number
    messageId?: number | null
    recipients?: NotificationRecipientUncheckedCreateNestedManyWithoutNotificationInput
  }

  export type NotificationCreateOrConnectWithoutTicketInput = {
    where: NotificationWhereUniqueInput
    create: XOR<NotificationCreateWithoutTicketInput, NotificationUncheckedCreateWithoutTicketInput>
  }

  export type NotificationCreateManyTicketInputEnvelope = {
    data: NotificationCreateManyTicketInput | NotificationCreateManyTicketInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutCreatedTicketsInput = {
    update: XOR<UserUpdateWithoutCreatedTicketsInput, UserUncheckedUpdateWithoutCreatedTicketsInput>
    create: XOR<UserCreateWithoutCreatedTicketsInput, UserUncheckedCreateWithoutCreatedTicketsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCreatedTicketsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCreatedTicketsInput, UserUncheckedUpdateWithoutCreatedTicketsInput>
  }

  export type UserUpdateWithoutCreatedTicketsInput = {
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedTickets?: TicketUpdateManyWithoutUpdatedByUserNestedInput
    messages?: MessageUpdateManyWithoutSenderNestedInput
    messageSeens?: MessageSeenUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUpdateManyWithoutCreatedByNestedInput
    notificationRecipients?: NotificationRecipientUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutCreatedTicketsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedTickets?: TicketUncheckedUpdateManyWithoutUpdatedByUserNestedInput
    messages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    messageSeens?: MessageSeenUncheckedUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutCreatedByNestedInput
    notificationRecipients?: NotificationRecipientUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserUpsertWithoutUpdatedTicketsInput = {
    update: XOR<UserUpdateWithoutUpdatedTicketsInput, UserUncheckedUpdateWithoutUpdatedTicketsInput>
    create: XOR<UserCreateWithoutUpdatedTicketsInput, UserUncheckedCreateWithoutUpdatedTicketsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutUpdatedTicketsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutUpdatedTicketsInput, UserUncheckedUpdateWithoutUpdatedTicketsInput>
  }

  export type UserUpdateWithoutUpdatedTicketsInput = {
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdTickets?: TicketUpdateManyWithoutCreatedByUserNestedInput
    messages?: MessageUpdateManyWithoutSenderNestedInput
    messageSeens?: MessageSeenUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUpdateManyWithoutCreatedByNestedInput
    notificationRecipients?: NotificationRecipientUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutUpdatedTicketsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdTickets?: TicketUncheckedUpdateManyWithoutCreatedByUserNestedInput
    messages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    messageSeens?: MessageSeenUncheckedUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutCreatedByNestedInput
    notificationRecipients?: NotificationRecipientUncheckedUpdateManyWithoutUserNestedInput
  }

  export type MessageUpsertWithWhereUniqueWithoutTicketInput = {
    where: MessageWhereUniqueInput
    update: XOR<MessageUpdateWithoutTicketInput, MessageUncheckedUpdateWithoutTicketInput>
    create: XOR<MessageCreateWithoutTicketInput, MessageUncheckedCreateWithoutTicketInput>
  }

  export type MessageUpdateWithWhereUniqueWithoutTicketInput = {
    where: MessageWhereUniqueInput
    data: XOR<MessageUpdateWithoutTicketInput, MessageUncheckedUpdateWithoutTicketInput>
  }

  export type MessageUpdateManyWithWhereWithoutTicketInput = {
    where: MessageScalarWhereInput
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyWithoutTicketInput>
  }

  export type NotificationUpsertWithWhereUniqueWithoutTicketInput = {
    where: NotificationWhereUniqueInput
    update: XOR<NotificationUpdateWithoutTicketInput, NotificationUncheckedUpdateWithoutTicketInput>
    create: XOR<NotificationCreateWithoutTicketInput, NotificationUncheckedCreateWithoutTicketInput>
  }

  export type NotificationUpdateWithWhereUniqueWithoutTicketInput = {
    where: NotificationWhereUniqueInput
    data: XOR<NotificationUpdateWithoutTicketInput, NotificationUncheckedUpdateWithoutTicketInput>
  }

  export type NotificationUpdateManyWithWhereWithoutTicketInput = {
    where: NotificationScalarWhereInput
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyWithoutTicketInput>
  }

  export type UserCreateWithoutMessagesInput = {
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
    createdTickets?: TicketCreateNestedManyWithoutCreatedByUserInput
    updatedTickets?: TicketCreateNestedManyWithoutUpdatedByUserInput
    messageSeens?: MessageSeenCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationCreateNestedManyWithoutCreatedByInput
    notificationRecipients?: NotificationRecipientCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutMessagesInput = {
    id?: number
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
    createdTickets?: TicketUncheckedCreateNestedManyWithoutCreatedByUserInput
    updatedTickets?: TicketUncheckedCreateNestedManyWithoutUpdatedByUserInput
    messageSeens?: MessageSeenUncheckedCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutCreatedByInput
    notificationRecipients?: NotificationRecipientUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutMessagesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutMessagesInput, UserUncheckedCreateWithoutMessagesInput>
  }

  export type TicketCreateWithoutMessagesInput = {
    ticketCode: string
    description: string
    customerName: string
    controllerNo: string
    head?: string | null
    imei?: string | null
    hp?: string | null
    motorType?: string | null
    state: string
    district: string
    village?: string | null
    block?: string | null
    complaintType: string
    faultCode: string
    status?: $Enums.TicketStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    createdByUser: UserCreateNestedOneWithoutCreatedTicketsInput
    updatedByUser?: UserCreateNestedOneWithoutUpdatedTicketsInput
    notifications?: NotificationCreateNestedManyWithoutTicketInput
  }

  export type TicketUncheckedCreateWithoutMessagesInput = {
    id?: number
    ticketCode: string
    description: string
    customerName: string
    controllerNo: string
    head?: string | null
    imei?: string | null
    hp?: string | null
    motorType?: string | null
    state: string
    district: string
    village?: string | null
    block?: string | null
    complaintType: string
    faultCode: string
    status?: $Enums.TicketStatus
    createdBy: number
    updatedBy?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    notifications?: NotificationUncheckedCreateNestedManyWithoutTicketInput
  }

  export type TicketCreateOrConnectWithoutMessagesInput = {
    where: TicketWhereUniqueInput
    create: XOR<TicketCreateWithoutMessagesInput, TicketUncheckedCreateWithoutMessagesInput>
  }

  export type NotificationCreateWithoutMessageInput = {
    title: string
    description: string
    type: string
    createdAt?: Date | string
    createdBy: UserCreateNestedOneWithoutSentNotificationsInput
    ticket?: TicketCreateNestedOneWithoutNotificationsInput
    recipients?: NotificationRecipientCreateNestedManyWithoutNotificationInput
  }

  export type NotificationUncheckedCreateWithoutMessageInput = {
    id?: number
    title: string
    description: string
    type: string
    createdAt?: Date | string
    createdById: number
    ticketId?: number | null
    recipients?: NotificationRecipientUncheckedCreateNestedManyWithoutNotificationInput
  }

  export type NotificationCreateOrConnectWithoutMessageInput = {
    where: NotificationWhereUniqueInput
    create: XOR<NotificationCreateWithoutMessageInput, NotificationUncheckedCreateWithoutMessageInput>
  }

  export type NotificationCreateManyMessageInputEnvelope = {
    data: NotificationCreateManyMessageInput | NotificationCreateManyMessageInput[]
    skipDuplicates?: boolean
  }

  export type AttachmentsCreateWithoutMessageInput = {
    fileName: string
    fileType: string
    fileSize: number
    fileUrl: string
    createdAt?: Date | string
  }

  export type AttachmentsUncheckedCreateWithoutMessageInput = {
    id?: number
    fileName: string
    fileType: string
    fileSize: number
    fileUrl: string
    createdAt?: Date | string
  }

  export type AttachmentsCreateOrConnectWithoutMessageInput = {
    where: AttachmentsWhereUniqueInput
    create: XOR<AttachmentsCreateWithoutMessageInput, AttachmentsUncheckedCreateWithoutMessageInput>
  }

  export type AttachmentsCreateManyMessageInputEnvelope = {
    data: AttachmentsCreateManyMessageInput | AttachmentsCreateManyMessageInput[]
    skipDuplicates?: boolean
  }

  export type MessageSeenCreateWithoutMessageInput = {
    seenAt?: Date | string
    user: UserCreateNestedOneWithoutMessageSeensInput
  }

  export type MessageSeenUncheckedCreateWithoutMessageInput = {
    id?: number
    seenAt?: Date | string
    userId: number
  }

  export type MessageSeenCreateOrConnectWithoutMessageInput = {
    where: MessageSeenWhereUniqueInput
    create: XOR<MessageSeenCreateWithoutMessageInput, MessageSeenUncheckedCreateWithoutMessageInput>
  }

  export type MessageSeenCreateManyMessageInputEnvelope = {
    data: MessageSeenCreateManyMessageInput | MessageSeenCreateManyMessageInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutMessagesInput = {
    update: XOR<UserUpdateWithoutMessagesInput, UserUncheckedUpdateWithoutMessagesInput>
    create: XOR<UserCreateWithoutMessagesInput, UserUncheckedCreateWithoutMessagesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutMessagesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutMessagesInput, UserUncheckedUpdateWithoutMessagesInput>
  }

  export type UserUpdateWithoutMessagesInput = {
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdTickets?: TicketUpdateManyWithoutCreatedByUserNestedInput
    updatedTickets?: TicketUpdateManyWithoutUpdatedByUserNestedInput
    messageSeens?: MessageSeenUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUpdateManyWithoutCreatedByNestedInput
    notificationRecipients?: NotificationRecipientUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutMessagesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdTickets?: TicketUncheckedUpdateManyWithoutCreatedByUserNestedInput
    updatedTickets?: TicketUncheckedUpdateManyWithoutUpdatedByUserNestedInput
    messageSeens?: MessageSeenUncheckedUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutCreatedByNestedInput
    notificationRecipients?: NotificationRecipientUncheckedUpdateManyWithoutUserNestedInput
  }

  export type TicketUpsertWithoutMessagesInput = {
    update: XOR<TicketUpdateWithoutMessagesInput, TicketUncheckedUpdateWithoutMessagesInput>
    create: XOR<TicketCreateWithoutMessagesInput, TicketUncheckedCreateWithoutMessagesInput>
    where?: TicketWhereInput
  }

  export type TicketUpdateToOneWithWhereWithoutMessagesInput = {
    where?: TicketWhereInput
    data: XOR<TicketUpdateWithoutMessagesInput, TicketUncheckedUpdateWithoutMessagesInput>
  }

  export type TicketUpdateWithoutMessagesInput = {
    ticketCode?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    controllerNo?: StringFieldUpdateOperationsInput | string
    head?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: NullableStringFieldUpdateOperationsInput | string | null
    hp?: NullableStringFieldUpdateOperationsInput | string | null
    motorType?: NullableStringFieldUpdateOperationsInput | string | null
    state?: StringFieldUpdateOperationsInput | string
    district?: StringFieldUpdateOperationsInput | string
    village?: NullableStringFieldUpdateOperationsInput | string | null
    block?: NullableStringFieldUpdateOperationsInput | string | null
    complaintType?: StringFieldUpdateOperationsInput | string
    faultCode?: StringFieldUpdateOperationsInput | string
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdByUser?: UserUpdateOneRequiredWithoutCreatedTicketsNestedInput
    updatedByUser?: UserUpdateOneWithoutUpdatedTicketsNestedInput
    notifications?: NotificationUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateWithoutMessagesInput = {
    id?: IntFieldUpdateOperationsInput | number
    ticketCode?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    controllerNo?: StringFieldUpdateOperationsInput | string
    head?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: NullableStringFieldUpdateOperationsInput | string | null
    hp?: NullableStringFieldUpdateOperationsInput | string | null
    motorType?: NullableStringFieldUpdateOperationsInput | string | null
    state?: StringFieldUpdateOperationsInput | string
    district?: StringFieldUpdateOperationsInput | string
    village?: NullableStringFieldUpdateOperationsInput | string | null
    block?: NullableStringFieldUpdateOperationsInput | string | null
    complaintType?: StringFieldUpdateOperationsInput | string
    faultCode?: StringFieldUpdateOperationsInput | string
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    createdBy?: IntFieldUpdateOperationsInput | number
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notifications?: NotificationUncheckedUpdateManyWithoutTicketNestedInput
  }

  export type NotificationUpsertWithWhereUniqueWithoutMessageInput = {
    where: NotificationWhereUniqueInput
    update: XOR<NotificationUpdateWithoutMessageInput, NotificationUncheckedUpdateWithoutMessageInput>
    create: XOR<NotificationCreateWithoutMessageInput, NotificationUncheckedCreateWithoutMessageInput>
  }

  export type NotificationUpdateWithWhereUniqueWithoutMessageInput = {
    where: NotificationWhereUniqueInput
    data: XOR<NotificationUpdateWithoutMessageInput, NotificationUncheckedUpdateWithoutMessageInput>
  }

  export type NotificationUpdateManyWithWhereWithoutMessageInput = {
    where: NotificationScalarWhereInput
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyWithoutMessageInput>
  }

  export type AttachmentsUpsertWithWhereUniqueWithoutMessageInput = {
    where: AttachmentsWhereUniqueInput
    update: XOR<AttachmentsUpdateWithoutMessageInput, AttachmentsUncheckedUpdateWithoutMessageInput>
    create: XOR<AttachmentsCreateWithoutMessageInput, AttachmentsUncheckedCreateWithoutMessageInput>
  }

  export type AttachmentsUpdateWithWhereUniqueWithoutMessageInput = {
    where: AttachmentsWhereUniqueInput
    data: XOR<AttachmentsUpdateWithoutMessageInput, AttachmentsUncheckedUpdateWithoutMessageInput>
  }

  export type AttachmentsUpdateManyWithWhereWithoutMessageInput = {
    where: AttachmentsScalarWhereInput
    data: XOR<AttachmentsUpdateManyMutationInput, AttachmentsUncheckedUpdateManyWithoutMessageInput>
  }

  export type AttachmentsScalarWhereInput = {
    AND?: AttachmentsScalarWhereInput | AttachmentsScalarWhereInput[]
    OR?: AttachmentsScalarWhereInput[]
    NOT?: AttachmentsScalarWhereInput | AttachmentsScalarWhereInput[]
    id?: IntFilter<"Attachments"> | number
    fileName?: StringFilter<"Attachments"> | string
    fileType?: StringFilter<"Attachments"> | string
    fileSize?: IntFilter<"Attachments"> | number
    fileUrl?: StringFilter<"Attachments"> | string
    createdAt?: DateTimeFilter<"Attachments"> | Date | string
    messageId?: IntFilter<"Attachments"> | number
  }

  export type MessageSeenUpsertWithWhereUniqueWithoutMessageInput = {
    where: MessageSeenWhereUniqueInput
    update: XOR<MessageSeenUpdateWithoutMessageInput, MessageSeenUncheckedUpdateWithoutMessageInput>
    create: XOR<MessageSeenCreateWithoutMessageInput, MessageSeenUncheckedCreateWithoutMessageInput>
  }

  export type MessageSeenUpdateWithWhereUniqueWithoutMessageInput = {
    where: MessageSeenWhereUniqueInput
    data: XOR<MessageSeenUpdateWithoutMessageInput, MessageSeenUncheckedUpdateWithoutMessageInput>
  }

  export type MessageSeenUpdateManyWithWhereWithoutMessageInput = {
    where: MessageSeenScalarWhereInput
    data: XOR<MessageSeenUpdateManyMutationInput, MessageSeenUncheckedUpdateManyWithoutMessageInput>
  }

  export type MessageCreateWithoutSeenByInput = {
    content: string
    createdAt?: Date | string
    sender: UserCreateNestedOneWithoutMessagesInput
    ticket: TicketCreateNestedOneWithoutMessagesInput
    notification?: NotificationCreateNestedManyWithoutMessageInput
    attachments?: AttachmentsCreateNestedManyWithoutMessageInput
  }

  export type MessageUncheckedCreateWithoutSeenByInput = {
    id?: number
    content: string
    createdAt?: Date | string
    senderId: number
    ticketId: number
    notification?: NotificationUncheckedCreateNestedManyWithoutMessageInput
    attachments?: AttachmentsUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageCreateOrConnectWithoutSeenByInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutSeenByInput, MessageUncheckedCreateWithoutSeenByInput>
  }

  export type UserCreateWithoutMessageSeensInput = {
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
    createdTickets?: TicketCreateNestedManyWithoutCreatedByUserInput
    updatedTickets?: TicketCreateNestedManyWithoutUpdatedByUserInput
    messages?: MessageCreateNestedManyWithoutSenderInput
    sentNotifications?: NotificationCreateNestedManyWithoutCreatedByInput
    notificationRecipients?: NotificationRecipientCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutMessageSeensInput = {
    id?: number
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
    createdTickets?: TicketUncheckedCreateNestedManyWithoutCreatedByUserInput
    updatedTickets?: TicketUncheckedCreateNestedManyWithoutUpdatedByUserInput
    messages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutCreatedByInput
    notificationRecipients?: NotificationRecipientUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutMessageSeensInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutMessageSeensInput, UserUncheckedCreateWithoutMessageSeensInput>
  }

  export type MessageUpsertWithoutSeenByInput = {
    update: XOR<MessageUpdateWithoutSeenByInput, MessageUncheckedUpdateWithoutSeenByInput>
    create: XOR<MessageCreateWithoutSeenByInput, MessageUncheckedCreateWithoutSeenByInput>
    where?: MessageWhereInput
  }

  export type MessageUpdateToOneWithWhereWithoutSeenByInput = {
    where?: MessageWhereInput
    data: XOR<MessageUpdateWithoutSeenByInput, MessageUncheckedUpdateWithoutSeenByInput>
  }

  export type MessageUpdateWithoutSeenByInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutMessagesNestedInput
    ticket?: TicketUpdateOneRequiredWithoutMessagesNestedInput
    notification?: NotificationUpdateManyWithoutMessageNestedInput
    attachments?: AttachmentsUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateWithoutSeenByInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
    ticketId?: IntFieldUpdateOperationsInput | number
    notification?: NotificationUncheckedUpdateManyWithoutMessageNestedInput
    attachments?: AttachmentsUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type UserUpsertWithoutMessageSeensInput = {
    update: XOR<UserUpdateWithoutMessageSeensInput, UserUncheckedUpdateWithoutMessageSeensInput>
    create: XOR<UserCreateWithoutMessageSeensInput, UserUncheckedCreateWithoutMessageSeensInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutMessageSeensInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutMessageSeensInput, UserUncheckedUpdateWithoutMessageSeensInput>
  }

  export type UserUpdateWithoutMessageSeensInput = {
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdTickets?: TicketUpdateManyWithoutCreatedByUserNestedInput
    updatedTickets?: TicketUpdateManyWithoutUpdatedByUserNestedInput
    messages?: MessageUpdateManyWithoutSenderNestedInput
    sentNotifications?: NotificationUpdateManyWithoutCreatedByNestedInput
    notificationRecipients?: NotificationRecipientUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutMessageSeensInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdTickets?: TicketUncheckedUpdateManyWithoutCreatedByUserNestedInput
    updatedTickets?: TicketUncheckedUpdateManyWithoutUpdatedByUserNestedInput
    messages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutCreatedByNestedInput
    notificationRecipients?: NotificationRecipientUncheckedUpdateManyWithoutUserNestedInput
  }

  export type MessageCreateWithoutAttachmentsInput = {
    content: string
    createdAt?: Date | string
    sender: UserCreateNestedOneWithoutMessagesInput
    ticket: TicketCreateNestedOneWithoutMessagesInput
    notification?: NotificationCreateNestedManyWithoutMessageInput
    seenBy?: MessageSeenCreateNestedManyWithoutMessageInput
  }

  export type MessageUncheckedCreateWithoutAttachmentsInput = {
    id?: number
    content: string
    createdAt?: Date | string
    senderId: number
    ticketId: number
    notification?: NotificationUncheckedCreateNestedManyWithoutMessageInput
    seenBy?: MessageSeenUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageCreateOrConnectWithoutAttachmentsInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutAttachmentsInput, MessageUncheckedCreateWithoutAttachmentsInput>
  }

  export type MessageUpsertWithoutAttachmentsInput = {
    update: XOR<MessageUpdateWithoutAttachmentsInput, MessageUncheckedUpdateWithoutAttachmentsInput>
    create: XOR<MessageCreateWithoutAttachmentsInput, MessageUncheckedCreateWithoutAttachmentsInput>
    where?: MessageWhereInput
  }

  export type MessageUpdateToOneWithWhereWithoutAttachmentsInput = {
    where?: MessageWhereInput
    data: XOR<MessageUpdateWithoutAttachmentsInput, MessageUncheckedUpdateWithoutAttachmentsInput>
  }

  export type MessageUpdateWithoutAttachmentsInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutMessagesNestedInput
    ticket?: TicketUpdateOneRequiredWithoutMessagesNestedInput
    notification?: NotificationUpdateManyWithoutMessageNestedInput
    seenBy?: MessageSeenUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateWithoutAttachmentsInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
    ticketId?: IntFieldUpdateOperationsInput | number
    notification?: NotificationUncheckedUpdateManyWithoutMessageNestedInput
    seenBy?: MessageSeenUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type MessageCreateWithoutNotificationInput = {
    content: string
    createdAt?: Date | string
    sender: UserCreateNestedOneWithoutMessagesInput
    ticket: TicketCreateNestedOneWithoutMessagesInput
    attachments?: AttachmentsCreateNestedManyWithoutMessageInput
    seenBy?: MessageSeenCreateNestedManyWithoutMessageInput
  }

  export type MessageUncheckedCreateWithoutNotificationInput = {
    id?: number
    content: string
    createdAt?: Date | string
    senderId: number
    ticketId: number
    attachments?: AttachmentsUncheckedCreateNestedManyWithoutMessageInput
    seenBy?: MessageSeenUncheckedCreateNestedManyWithoutMessageInput
  }

  export type MessageCreateOrConnectWithoutNotificationInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutNotificationInput, MessageUncheckedCreateWithoutNotificationInput>
  }

  export type UserCreateWithoutSentNotificationsInput = {
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
    createdTickets?: TicketCreateNestedManyWithoutCreatedByUserInput
    updatedTickets?: TicketCreateNestedManyWithoutUpdatedByUserInput
    messages?: MessageCreateNestedManyWithoutSenderInput
    messageSeens?: MessageSeenCreateNestedManyWithoutUserInput
    notificationRecipients?: NotificationRecipientCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSentNotificationsInput = {
    id?: number
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
    createdTickets?: TicketUncheckedCreateNestedManyWithoutCreatedByUserInput
    updatedTickets?: TicketUncheckedCreateNestedManyWithoutUpdatedByUserInput
    messages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    messageSeens?: MessageSeenUncheckedCreateNestedManyWithoutUserInput
    notificationRecipients?: NotificationRecipientUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSentNotificationsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSentNotificationsInput, UserUncheckedCreateWithoutSentNotificationsInput>
  }

  export type TicketCreateWithoutNotificationsInput = {
    ticketCode: string
    description: string
    customerName: string
    controllerNo: string
    head?: string | null
    imei?: string | null
    hp?: string | null
    motorType?: string | null
    state: string
    district: string
    village?: string | null
    block?: string | null
    complaintType: string
    faultCode: string
    status?: $Enums.TicketStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    createdByUser: UserCreateNestedOneWithoutCreatedTicketsInput
    updatedByUser?: UserCreateNestedOneWithoutUpdatedTicketsInput
    messages?: MessageCreateNestedManyWithoutTicketInput
  }

  export type TicketUncheckedCreateWithoutNotificationsInput = {
    id?: number
    ticketCode: string
    description: string
    customerName: string
    controllerNo: string
    head?: string | null
    imei?: string | null
    hp?: string | null
    motorType?: string | null
    state: string
    district: string
    village?: string | null
    block?: string | null
    complaintType: string
    faultCode: string
    status?: $Enums.TicketStatus
    createdBy: number
    updatedBy?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    messages?: MessageUncheckedCreateNestedManyWithoutTicketInput
  }

  export type TicketCreateOrConnectWithoutNotificationsInput = {
    where: TicketWhereUniqueInput
    create: XOR<TicketCreateWithoutNotificationsInput, TicketUncheckedCreateWithoutNotificationsInput>
  }

  export type NotificationRecipientCreateWithoutNotificationInput = {
    seen?: boolean
    seenAt?: Date | string | null
    user: UserCreateNestedOneWithoutNotificationRecipientsInput
  }

  export type NotificationRecipientUncheckedCreateWithoutNotificationInput = {
    id?: number
    userId: number
    seen?: boolean
    seenAt?: Date | string | null
  }

  export type NotificationRecipientCreateOrConnectWithoutNotificationInput = {
    where: NotificationRecipientWhereUniqueInput
    create: XOR<NotificationRecipientCreateWithoutNotificationInput, NotificationRecipientUncheckedCreateWithoutNotificationInput>
  }

  export type NotificationRecipientCreateManyNotificationInputEnvelope = {
    data: NotificationRecipientCreateManyNotificationInput | NotificationRecipientCreateManyNotificationInput[]
    skipDuplicates?: boolean
  }

  export type MessageUpsertWithoutNotificationInput = {
    update: XOR<MessageUpdateWithoutNotificationInput, MessageUncheckedUpdateWithoutNotificationInput>
    create: XOR<MessageCreateWithoutNotificationInput, MessageUncheckedCreateWithoutNotificationInput>
    where?: MessageWhereInput
  }

  export type MessageUpdateToOneWithWhereWithoutNotificationInput = {
    where?: MessageWhereInput
    data: XOR<MessageUpdateWithoutNotificationInput, MessageUncheckedUpdateWithoutNotificationInput>
  }

  export type MessageUpdateWithoutNotificationInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutMessagesNestedInput
    ticket?: TicketUpdateOneRequiredWithoutMessagesNestedInput
    attachments?: AttachmentsUpdateManyWithoutMessageNestedInput
    seenBy?: MessageSeenUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateWithoutNotificationInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
    ticketId?: IntFieldUpdateOperationsInput | number
    attachments?: AttachmentsUncheckedUpdateManyWithoutMessageNestedInput
    seenBy?: MessageSeenUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type UserUpsertWithoutSentNotificationsInput = {
    update: XOR<UserUpdateWithoutSentNotificationsInput, UserUncheckedUpdateWithoutSentNotificationsInput>
    create: XOR<UserCreateWithoutSentNotificationsInput, UserUncheckedCreateWithoutSentNotificationsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSentNotificationsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSentNotificationsInput, UserUncheckedUpdateWithoutSentNotificationsInput>
  }

  export type UserUpdateWithoutSentNotificationsInput = {
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdTickets?: TicketUpdateManyWithoutCreatedByUserNestedInput
    updatedTickets?: TicketUpdateManyWithoutUpdatedByUserNestedInput
    messages?: MessageUpdateManyWithoutSenderNestedInput
    messageSeens?: MessageSeenUpdateManyWithoutUserNestedInput
    notificationRecipients?: NotificationRecipientUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSentNotificationsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdTickets?: TicketUncheckedUpdateManyWithoutCreatedByUserNestedInput
    updatedTickets?: TicketUncheckedUpdateManyWithoutUpdatedByUserNestedInput
    messages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    messageSeens?: MessageSeenUncheckedUpdateManyWithoutUserNestedInput
    notificationRecipients?: NotificationRecipientUncheckedUpdateManyWithoutUserNestedInput
  }

  export type TicketUpsertWithoutNotificationsInput = {
    update: XOR<TicketUpdateWithoutNotificationsInput, TicketUncheckedUpdateWithoutNotificationsInput>
    create: XOR<TicketCreateWithoutNotificationsInput, TicketUncheckedCreateWithoutNotificationsInput>
    where?: TicketWhereInput
  }

  export type TicketUpdateToOneWithWhereWithoutNotificationsInput = {
    where?: TicketWhereInput
    data: XOR<TicketUpdateWithoutNotificationsInput, TicketUncheckedUpdateWithoutNotificationsInput>
  }

  export type TicketUpdateWithoutNotificationsInput = {
    ticketCode?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    controllerNo?: StringFieldUpdateOperationsInput | string
    head?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: NullableStringFieldUpdateOperationsInput | string | null
    hp?: NullableStringFieldUpdateOperationsInput | string | null
    motorType?: NullableStringFieldUpdateOperationsInput | string | null
    state?: StringFieldUpdateOperationsInput | string
    district?: StringFieldUpdateOperationsInput | string
    village?: NullableStringFieldUpdateOperationsInput | string | null
    block?: NullableStringFieldUpdateOperationsInput | string | null
    complaintType?: StringFieldUpdateOperationsInput | string
    faultCode?: StringFieldUpdateOperationsInput | string
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdByUser?: UserUpdateOneRequiredWithoutCreatedTicketsNestedInput
    updatedByUser?: UserUpdateOneWithoutUpdatedTicketsNestedInput
    messages?: MessageUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateWithoutNotificationsInput = {
    id?: IntFieldUpdateOperationsInput | number
    ticketCode?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    controllerNo?: StringFieldUpdateOperationsInput | string
    head?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: NullableStringFieldUpdateOperationsInput | string | null
    hp?: NullableStringFieldUpdateOperationsInput | string | null
    motorType?: NullableStringFieldUpdateOperationsInput | string | null
    state?: StringFieldUpdateOperationsInput | string
    district?: StringFieldUpdateOperationsInput | string
    village?: NullableStringFieldUpdateOperationsInput | string | null
    block?: NullableStringFieldUpdateOperationsInput | string | null
    complaintType?: StringFieldUpdateOperationsInput | string
    faultCode?: StringFieldUpdateOperationsInput | string
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    createdBy?: IntFieldUpdateOperationsInput | number
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: MessageUncheckedUpdateManyWithoutTicketNestedInput
  }

  export type NotificationRecipientUpsertWithWhereUniqueWithoutNotificationInput = {
    where: NotificationRecipientWhereUniqueInput
    update: XOR<NotificationRecipientUpdateWithoutNotificationInput, NotificationRecipientUncheckedUpdateWithoutNotificationInput>
    create: XOR<NotificationRecipientCreateWithoutNotificationInput, NotificationRecipientUncheckedCreateWithoutNotificationInput>
  }

  export type NotificationRecipientUpdateWithWhereUniqueWithoutNotificationInput = {
    where: NotificationRecipientWhereUniqueInput
    data: XOR<NotificationRecipientUpdateWithoutNotificationInput, NotificationRecipientUncheckedUpdateWithoutNotificationInput>
  }

  export type NotificationRecipientUpdateManyWithWhereWithoutNotificationInput = {
    where: NotificationRecipientScalarWhereInput
    data: XOR<NotificationRecipientUpdateManyMutationInput, NotificationRecipientUncheckedUpdateManyWithoutNotificationInput>
  }

  export type NotificationCreateWithoutRecipientsInput = {
    title: string
    description: string
    type: string
    createdAt?: Date | string
    message?: MessageCreateNestedOneWithoutNotificationInput
    createdBy: UserCreateNestedOneWithoutSentNotificationsInput
    ticket?: TicketCreateNestedOneWithoutNotificationsInput
  }

  export type NotificationUncheckedCreateWithoutRecipientsInput = {
    id?: number
    title: string
    description: string
    type: string
    createdAt?: Date | string
    createdById: number
    ticketId?: number | null
    messageId?: number | null
  }

  export type NotificationCreateOrConnectWithoutRecipientsInput = {
    where: NotificationWhereUniqueInput
    create: XOR<NotificationCreateWithoutRecipientsInput, NotificationUncheckedCreateWithoutRecipientsInput>
  }

  export type UserCreateWithoutNotificationRecipientsInput = {
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
    createdTickets?: TicketCreateNestedManyWithoutCreatedByUserInput
    updatedTickets?: TicketCreateNestedManyWithoutUpdatedByUserInput
    messages?: MessageCreateNestedManyWithoutSenderInput
    messageSeens?: MessageSeenCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationCreateNestedManyWithoutCreatedByInput
  }

  export type UserUncheckedCreateWithoutNotificationRecipientsInput = {
    id?: number
    name: string
    phone: string
    password: string
    role: $Enums.Role
    lastLogin?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string | null
    deletedAt?: Date | string | null
    createdTickets?: TicketUncheckedCreateNestedManyWithoutCreatedByUserInput
    updatedTickets?: TicketUncheckedCreateNestedManyWithoutUpdatedByUserInput
    messages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    messageSeens?: MessageSeenUncheckedCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutCreatedByInput
  }

  export type UserCreateOrConnectWithoutNotificationRecipientsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutNotificationRecipientsInput, UserUncheckedCreateWithoutNotificationRecipientsInput>
  }

  export type NotificationUpsertWithoutRecipientsInput = {
    update: XOR<NotificationUpdateWithoutRecipientsInput, NotificationUncheckedUpdateWithoutRecipientsInput>
    create: XOR<NotificationCreateWithoutRecipientsInput, NotificationUncheckedCreateWithoutRecipientsInput>
    where?: NotificationWhereInput
  }

  export type NotificationUpdateToOneWithWhereWithoutRecipientsInput = {
    where?: NotificationWhereInput
    data: XOR<NotificationUpdateWithoutRecipientsInput, NotificationUncheckedUpdateWithoutRecipientsInput>
  }

  export type NotificationUpdateWithoutRecipientsInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    message?: MessageUpdateOneWithoutNotificationNestedInput
    createdBy?: UserUpdateOneRequiredWithoutSentNotificationsNestedInput
    ticket?: TicketUpdateOneWithoutNotificationsNestedInput
  }

  export type NotificationUncheckedUpdateWithoutRecipientsInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdById?: IntFieldUpdateOperationsInput | number
    ticketId?: NullableIntFieldUpdateOperationsInput | number | null
    messageId?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type UserUpsertWithoutNotificationRecipientsInput = {
    update: XOR<UserUpdateWithoutNotificationRecipientsInput, UserUncheckedUpdateWithoutNotificationRecipientsInput>
    create: XOR<UserCreateWithoutNotificationRecipientsInput, UserUncheckedCreateWithoutNotificationRecipientsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutNotificationRecipientsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutNotificationRecipientsInput, UserUncheckedUpdateWithoutNotificationRecipientsInput>
  }

  export type UserUpdateWithoutNotificationRecipientsInput = {
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdTickets?: TicketUpdateManyWithoutCreatedByUserNestedInput
    updatedTickets?: TicketUpdateManyWithoutUpdatedByUserNestedInput
    messages?: MessageUpdateManyWithoutSenderNestedInput
    messageSeens?: MessageSeenUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUpdateManyWithoutCreatedByNestedInput
  }

  export type UserUncheckedUpdateWithoutNotificationRecipientsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    phone?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdTickets?: TicketUncheckedUpdateManyWithoutCreatedByUserNestedInput
    updatedTickets?: TicketUncheckedUpdateManyWithoutUpdatedByUserNestedInput
    messages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    messageSeens?: MessageSeenUncheckedUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutCreatedByNestedInput
  }

  export type TicketCreateManyCreatedByUserInput = {
    id?: number
    ticketCode: string
    description: string
    customerName: string
    controllerNo: string
    head?: string | null
    imei?: string | null
    hp?: string | null
    motorType?: string | null
    state: string
    district: string
    village?: string | null
    block?: string | null
    complaintType: string
    faultCode: string
    status?: $Enums.TicketStatus
    updatedBy?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
  }

  export type TicketCreateManyUpdatedByUserInput = {
    id?: number
    ticketCode: string
    description: string
    customerName: string
    controllerNo: string
    head?: string | null
    imei?: string | null
    hp?: string | null
    motorType?: string | null
    state: string
    district: string
    village?: string | null
    block?: string | null
    complaintType: string
    faultCode: string
    status?: $Enums.TicketStatus
    createdBy: number
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
  }

  export type MessageCreateManySenderInput = {
    id?: number
    content: string
    createdAt?: Date | string
    ticketId: number
  }

  export type MessageSeenCreateManyUserInput = {
    id?: number
    seenAt?: Date | string
    messageId: number
  }

  export type NotificationCreateManyCreatedByInput = {
    id?: number
    title: string
    description: string
    type: string
    createdAt?: Date | string
    ticketId?: number | null
    messageId?: number | null
  }

  export type NotificationRecipientCreateManyUserInput = {
    id?: number
    notificationId: number
    seen?: boolean
    seenAt?: Date | string | null
  }

  export type TicketUpdateWithoutCreatedByUserInput = {
    ticketCode?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    controllerNo?: StringFieldUpdateOperationsInput | string
    head?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: NullableStringFieldUpdateOperationsInput | string | null
    hp?: NullableStringFieldUpdateOperationsInput | string | null
    motorType?: NullableStringFieldUpdateOperationsInput | string | null
    state?: StringFieldUpdateOperationsInput | string
    district?: StringFieldUpdateOperationsInput | string
    village?: NullableStringFieldUpdateOperationsInput | string | null
    block?: NullableStringFieldUpdateOperationsInput | string | null
    complaintType?: StringFieldUpdateOperationsInput | string
    faultCode?: StringFieldUpdateOperationsInput | string
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    updatedByUser?: UserUpdateOneWithoutUpdatedTicketsNestedInput
    messages?: MessageUpdateManyWithoutTicketNestedInput
    notifications?: NotificationUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateWithoutCreatedByUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    ticketCode?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    controllerNo?: StringFieldUpdateOperationsInput | string
    head?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: NullableStringFieldUpdateOperationsInput | string | null
    hp?: NullableStringFieldUpdateOperationsInput | string | null
    motorType?: NullableStringFieldUpdateOperationsInput | string | null
    state?: StringFieldUpdateOperationsInput | string
    district?: StringFieldUpdateOperationsInput | string
    village?: NullableStringFieldUpdateOperationsInput | string | null
    block?: NullableStringFieldUpdateOperationsInput | string | null
    complaintType?: StringFieldUpdateOperationsInput | string
    faultCode?: StringFieldUpdateOperationsInput | string
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: MessageUncheckedUpdateManyWithoutTicketNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateManyWithoutCreatedByUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    ticketCode?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    controllerNo?: StringFieldUpdateOperationsInput | string
    head?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: NullableStringFieldUpdateOperationsInput | string | null
    hp?: NullableStringFieldUpdateOperationsInput | string | null
    motorType?: NullableStringFieldUpdateOperationsInput | string | null
    state?: StringFieldUpdateOperationsInput | string
    district?: StringFieldUpdateOperationsInput | string
    village?: NullableStringFieldUpdateOperationsInput | string | null
    block?: NullableStringFieldUpdateOperationsInput | string | null
    complaintType?: StringFieldUpdateOperationsInput | string
    faultCode?: StringFieldUpdateOperationsInput | string
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    updatedBy?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TicketUpdateWithoutUpdatedByUserInput = {
    ticketCode?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    controllerNo?: StringFieldUpdateOperationsInput | string
    head?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: NullableStringFieldUpdateOperationsInput | string | null
    hp?: NullableStringFieldUpdateOperationsInput | string | null
    motorType?: NullableStringFieldUpdateOperationsInput | string | null
    state?: StringFieldUpdateOperationsInput | string
    district?: StringFieldUpdateOperationsInput | string
    village?: NullableStringFieldUpdateOperationsInput | string | null
    block?: NullableStringFieldUpdateOperationsInput | string | null
    complaintType?: StringFieldUpdateOperationsInput | string
    faultCode?: StringFieldUpdateOperationsInput | string
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdByUser?: UserUpdateOneRequiredWithoutCreatedTicketsNestedInput
    messages?: MessageUpdateManyWithoutTicketNestedInput
    notifications?: NotificationUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateWithoutUpdatedByUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    ticketCode?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    controllerNo?: StringFieldUpdateOperationsInput | string
    head?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: NullableStringFieldUpdateOperationsInput | string | null
    hp?: NullableStringFieldUpdateOperationsInput | string | null
    motorType?: NullableStringFieldUpdateOperationsInput | string | null
    state?: StringFieldUpdateOperationsInput | string
    district?: StringFieldUpdateOperationsInput | string
    village?: NullableStringFieldUpdateOperationsInput | string | null
    block?: NullableStringFieldUpdateOperationsInput | string | null
    complaintType?: StringFieldUpdateOperationsInput | string
    faultCode?: StringFieldUpdateOperationsInput | string
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    createdBy?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    messages?: MessageUncheckedUpdateManyWithoutTicketNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutTicketNestedInput
  }

  export type TicketUncheckedUpdateManyWithoutUpdatedByUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    ticketCode?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    controllerNo?: StringFieldUpdateOperationsInput | string
    head?: NullableStringFieldUpdateOperationsInput | string | null
    imei?: NullableStringFieldUpdateOperationsInput | string | null
    hp?: NullableStringFieldUpdateOperationsInput | string | null
    motorType?: NullableStringFieldUpdateOperationsInput | string | null
    state?: StringFieldUpdateOperationsInput | string
    district?: StringFieldUpdateOperationsInput | string
    village?: NullableStringFieldUpdateOperationsInput | string | null
    block?: NullableStringFieldUpdateOperationsInput | string | null
    complaintType?: StringFieldUpdateOperationsInput | string
    faultCode?: StringFieldUpdateOperationsInput | string
    status?: EnumTicketStatusFieldUpdateOperationsInput | $Enums.TicketStatus
    createdBy?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MessageUpdateWithoutSenderInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticket?: TicketUpdateOneRequiredWithoutMessagesNestedInput
    notification?: NotificationUpdateManyWithoutMessageNestedInput
    attachments?: AttachmentsUpdateManyWithoutMessageNestedInput
    seenBy?: MessageSeenUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateWithoutSenderInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticketId?: IntFieldUpdateOperationsInput | number
    notification?: NotificationUncheckedUpdateManyWithoutMessageNestedInput
    attachments?: AttachmentsUncheckedUpdateManyWithoutMessageNestedInput
    seenBy?: MessageSeenUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateManyWithoutSenderInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticketId?: IntFieldUpdateOperationsInput | number
  }

  export type MessageSeenUpdateWithoutUserInput = {
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    message?: MessageUpdateOneRequiredWithoutSeenByNestedInput
  }

  export type MessageSeenUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messageId?: IntFieldUpdateOperationsInput | number
  }

  export type MessageSeenUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messageId?: IntFieldUpdateOperationsInput | number
  }

  export type NotificationUpdateWithoutCreatedByInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    message?: MessageUpdateOneWithoutNotificationNestedInput
    ticket?: TicketUpdateOneWithoutNotificationsNestedInput
    recipients?: NotificationRecipientUpdateManyWithoutNotificationNestedInput
  }

  export type NotificationUncheckedUpdateWithoutCreatedByInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticketId?: NullableIntFieldUpdateOperationsInput | number | null
    messageId?: NullableIntFieldUpdateOperationsInput | number | null
    recipients?: NotificationRecipientUncheckedUpdateManyWithoutNotificationNestedInput
  }

  export type NotificationUncheckedUpdateManyWithoutCreatedByInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticketId?: NullableIntFieldUpdateOperationsInput | number | null
    messageId?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type NotificationRecipientUpdateWithoutUserInput = {
    seen?: BoolFieldUpdateOperationsInput | boolean
    seenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notification?: NotificationUpdateOneRequiredWithoutRecipientsNestedInput
  }

  export type NotificationRecipientUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    notificationId?: IntFieldUpdateOperationsInput | number
    seen?: BoolFieldUpdateOperationsInput | boolean
    seenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type NotificationRecipientUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    notificationId?: IntFieldUpdateOperationsInput | number
    seen?: BoolFieldUpdateOperationsInput | boolean
    seenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MessageCreateManyTicketInput = {
    id?: number
    content: string
    createdAt?: Date | string
    senderId: number
  }

  export type NotificationCreateManyTicketInput = {
    id?: number
    title: string
    description: string
    type: string
    createdAt?: Date | string
    createdById: number
    messageId?: number | null
  }

  export type MessageUpdateWithoutTicketInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutMessagesNestedInput
    notification?: NotificationUpdateManyWithoutMessageNestedInput
    attachments?: AttachmentsUpdateManyWithoutMessageNestedInput
    seenBy?: MessageSeenUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateWithoutTicketInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
    notification?: NotificationUncheckedUpdateManyWithoutMessageNestedInput
    attachments?: AttachmentsUncheckedUpdateManyWithoutMessageNestedInput
    seenBy?: MessageSeenUncheckedUpdateManyWithoutMessageNestedInput
  }

  export type MessageUncheckedUpdateManyWithoutTicketInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
  }

  export type NotificationUpdateWithoutTicketInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    message?: MessageUpdateOneWithoutNotificationNestedInput
    createdBy?: UserUpdateOneRequiredWithoutSentNotificationsNestedInput
    recipients?: NotificationRecipientUpdateManyWithoutNotificationNestedInput
  }

  export type NotificationUncheckedUpdateWithoutTicketInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdById?: IntFieldUpdateOperationsInput | number
    messageId?: NullableIntFieldUpdateOperationsInput | number | null
    recipients?: NotificationRecipientUncheckedUpdateManyWithoutNotificationNestedInput
  }

  export type NotificationUncheckedUpdateManyWithoutTicketInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdById?: IntFieldUpdateOperationsInput | number
    messageId?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type NotificationCreateManyMessageInput = {
    id?: number
    title: string
    description: string
    type: string
    createdAt?: Date | string
    createdById: number
    ticketId?: number | null
  }

  export type AttachmentsCreateManyMessageInput = {
    id?: number
    fileName: string
    fileType: string
    fileSize: number
    fileUrl: string
    createdAt?: Date | string
  }

  export type MessageSeenCreateManyMessageInput = {
    id?: number
    seenAt?: Date | string
    userId: number
  }

  export type NotificationUpdateWithoutMessageInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdBy?: UserUpdateOneRequiredWithoutSentNotificationsNestedInput
    ticket?: TicketUpdateOneWithoutNotificationsNestedInput
    recipients?: NotificationRecipientUpdateManyWithoutNotificationNestedInput
  }

  export type NotificationUncheckedUpdateWithoutMessageInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdById?: IntFieldUpdateOperationsInput | number
    ticketId?: NullableIntFieldUpdateOperationsInput | number | null
    recipients?: NotificationRecipientUncheckedUpdateManyWithoutNotificationNestedInput
  }

  export type NotificationUncheckedUpdateManyWithoutMessageInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdById?: IntFieldUpdateOperationsInput | number
    ticketId?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type AttachmentsUpdateWithoutMessageInput = {
    fileName?: StringFieldUpdateOperationsInput | string
    fileType?: StringFieldUpdateOperationsInput | string
    fileSize?: IntFieldUpdateOperationsInput | number
    fileUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AttachmentsUncheckedUpdateWithoutMessageInput = {
    id?: IntFieldUpdateOperationsInput | number
    fileName?: StringFieldUpdateOperationsInput | string
    fileType?: StringFieldUpdateOperationsInput | string
    fileSize?: IntFieldUpdateOperationsInput | number
    fileUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AttachmentsUncheckedUpdateManyWithoutMessageInput = {
    id?: IntFieldUpdateOperationsInput | number
    fileName?: StringFieldUpdateOperationsInput | string
    fileType?: StringFieldUpdateOperationsInput | string
    fileSize?: IntFieldUpdateOperationsInput | number
    fileUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageSeenUpdateWithoutMessageInput = {
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutMessageSeensNestedInput
  }

  export type MessageSeenUncheckedUpdateWithoutMessageInput = {
    id?: IntFieldUpdateOperationsInput | number
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: IntFieldUpdateOperationsInput | number
  }

  export type MessageSeenUncheckedUpdateManyWithoutMessageInput = {
    id?: IntFieldUpdateOperationsInput | number
    seenAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: IntFieldUpdateOperationsInput | number
  }

  export type NotificationRecipientCreateManyNotificationInput = {
    id?: number
    userId: number
    seen?: boolean
    seenAt?: Date | string | null
  }

  export type NotificationRecipientUpdateWithoutNotificationInput = {
    seen?: BoolFieldUpdateOperationsInput | boolean
    seenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    user?: UserUpdateOneRequiredWithoutNotificationRecipientsNestedInput
  }

  export type NotificationRecipientUncheckedUpdateWithoutNotificationInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    seen?: BoolFieldUpdateOperationsInput | boolean
    seenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type NotificationRecipientUncheckedUpdateManyWithoutNotificationInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    seen?: BoolFieldUpdateOperationsInput | boolean
    seenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}
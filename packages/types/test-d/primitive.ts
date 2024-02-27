import { expectAssignable, expectError } from 'tsd';
import type { Primitive } from '..';

expectAssignable<Primitive>(null);
expectAssignable<Primitive>(undefined);
expectAssignable<Primitive>('');
expectAssignable<Primitive>(0);
expectAssignable<Primitive>(Symbol(''));
expectAssignable<Primitive>(BigInt(9007199254740991));

expectError<Primitive>({});

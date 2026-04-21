import { describe, it, expect } from 'vitest';
import { CircularArray } from './CircularArray';

type User = {
    name: string;
};

describe('CircularArray', () => {

    const users: CircularArray<User> = CircularArray.from([
        { name: 'Harry' },
        { name: 'Ron' },
        { name: 'Hermione' },
        { name: 'Albus' },
        { name: 'Severus' },
        { name: 'Voldemort' },
    ]);

    describe('CircularArray.from()', () => {
        it('should be an instance of CircularArray', () => {
            expect(users).toBeInstanceOf(CircularArray);
        });

        it('should preserve all elements', () => {
            expect(users).toHaveLength(6);
        });
    });

    describe('getNext()', () => {
        it('should return the next element', () => {
            expect(users.getNext(0)).toEqual({ name: 'Ron' });
            expect(users.getNext(1)).toEqual({ name: 'Hermione' });
            expect(users.getNext(2)).toEqual({ name: 'Albus' });
        });

        it('should wrap around from the last element to the first', () => {
            expect(users.getNext(5)).toEqual({ name: 'Harry' });
        });

        it('should handle out-of-bounds offsets', () => {
            expect(users.getNext(6)).toEqual({ name: 'Ron' });   // 6 wraps to Harry, next is Ron
            expect(users.getNext(10)).toEqual({ name: 'Voldemort' }); // 10 wraps to Severus, next is Voldemort
            expect(users.getNext(11)).toEqual({ name: 'Harry' }); // 11 wraps to Voldemort, next is Harry
        });

        it('should handle a -1 offset', () => {
            expect(users.getNext(-1)).toEqual({ name: 'Harry' }); // -1 wraps to Voldemort, next is Harry
        });

        it('should give undefined when dealing with empty array', () => {
            expect(CircularArray.from([]).getNext(0)).toBeUndefined();
        });
    });

    describe('getPrev()', () => {
        it('should return the previous element', () => {
            expect(users.getPrev(1)).toEqual({ name: 'Harry' });
            expect(users.getPrev(2)).toEqual({ name: 'Ron' });
            expect(users.getPrev(5)).toEqual({ name: 'Severus' });
        });

        it('should wrap around from the first element to the last', () => {
            expect(users.getPrev(0)).toEqual({ name: 'Voldemort' });
        });

        it('should handle out-of-bounds offsets', () => {
            expect(users.getPrev(6)).toEqual({ name: 'Voldemort' }); // 6 wraps to Harry, prev is Voldemort
            expect(users.getPrev(7)).toEqual({ name: 'Harry' });     // 7 wraps to Ron, prev is Harry
        });

        it('should handle a -1 offset', () => {
            expect(users.getPrev(-1)).toEqual({ name: 'Severus' }); // -1 wraps to Voldemort, prev is Severus
        });

        it('should give undefined when dealing with empty array', () => {
            expect(CircularArray.from([]).getPrev(0)).toBeUndefined();
        });
    });

    describe('uniq()', () => {

        const usersWithDuplicates: CircularArray<User> = CircularArray.from([
            { name: 'Harry' },
            { name: 'Harry' },
            { name: 'Ron' },
            { name: 'Ron' },
            { name: 'Hermione' },
            { name: 'Hermione' },
        ]);

        it('removes duplicates', () => {
            expect(usersWithDuplicates.uniq()).toHaveLength(3);
        });
    });

});

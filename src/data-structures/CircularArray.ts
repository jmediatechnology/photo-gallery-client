export class CircularArray<T> extends Array<T> {

    static from<T>(arrayLike: ArrayLike<T> | Iterable<T>): CircularArray<T> {
        return super.from(arrayLike) as CircularArray<T>;
    }

    getNext(offset: number): T|undefined {
        const nextOffset = offset + 1;
        const wrappedNextOffset = nextOffset % this.length;
        return this.at(wrappedNextOffset);
    }

    getPrev(offset: number): T|undefined {
        const wrappedOffset = offset % this.length;
        const prevOffset = wrappedOffset - 1;
        return this.at(prevOffset);
    }

    uniq(): CircularArray<T> {
        return CircularArray.from(
            new Map(this.map(item => [JSON.stringify(item), item])).values()
        );
    }
}

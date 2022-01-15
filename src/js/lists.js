function ListFactory(compare = (a, b) => (a > b) - (a < b)) {

    class List {
        constructor(value, rest) {
            this.value = value;
            this.rest = rest;
        }

        empty() {
            return this.value === undefined;
        }

        push(x) {
            if (this.empty()) {
                this.value = x;
                this.rest = new List();
            } else {
                this.rest = new List(this.value, this.rest);
                this.value = x;
            }
            return this;
        }

        pop() {
            if (this.empty()) {
                return undefined;
            } else {
                let x = this.value;
                this.value = this.rest.value;
                this.rest = this.rest.rest;
                return x;
            }
        }

        enqueue(x) {
            if (this.empty()) {
                this.value = x;
                this.rest = new List();
            } else {
                this.rest.enqueue(x);
            }
            return this;
        }

        dequeue() {
            if (this.empty()) {
                return undefined;
            } else if (this.rest.empty()) {
                return this.pop();
            } else {
                return this.rest.dequeue();
            }
        }

        size() {
            if (this.empty()) {
                return 0;
            } else {
                return 1 + this.rest.size();
            }
        }

        toString() {
            if (!this.empty()) {
                console.log(this.value);
                this.rest.toString();
            }
        }

        exists(x, c = compare) {
            if (this.empty()) {
                return false;
            } else if (c(this.value, x) == 0) {
                return true;
            } else {
                return this.rest.exists(x, c);
            }
        }

        indexOf(x, c = compare) {
            if (this.empty()) {
                return -1;
            } else if (c(this.value, x) == 0) {
                return 0;
            } else {
                let n = this.rest.indexOf(x, c);
                return n < 0 ? n : n + 1;
            }
        }

        count(x, c = compare) {
            if (this.empty()) {
                return 0;
            } else {
                return (c(this.value, x) == 0) + this.rest.count(x, c);
            }
        }

        sortedInsert(x, c = compare) {
            if (this.empty() || c(x, this.value) < 1) {
                this.push(x);
            } else {
                this.rest.sortedInsert(x, c);
            }
            return this;
        }

        sort(c = compare) {

            if (!this.empty() && !this.rest.empty()) {
                let h = this.pop();
                let [min, max] = this.separate(h, c);
                this.catenate(min.sort(c)).catenate(max.sort(c).push(h));
            }
            return this;
        }

        separate(x, c = compare) {
            if (this.empty()) {
                return [new List(), new List()];
            } else {
                let h = this.pop();
                let [min, max] = this.separate(x, c);
                if (c(h, x) < 1) {
                    min.push(h);
                } else {
                    max.push(h);
                }
                return [min, max];
            }
        }

        catenate(l) {
            if (this.empty()) {
                this.value = l.value;
                this.rest = l.rest;
            } else {
                this.rest.catenate(l);
            }
            return this;
        }

        visit(callback) {
            if (!this.empty()) {
                callback(this.value);
                this.rest.visit(callback);
            }
            return this;
        }

        reduce(callback, payload) {
            if (this.empty()) {
                return payload;
            } else {
                payload = callback(this.value, payload);
                return this.rest.reduce(callback, payload);
            }
        }
        map(callback) {
            if (!this.empty()) {
                this.value = callback(this.value);
                this.rest.map(callback);
            }
            return this;
        }

        walk(callback, payload) {
            if (this.empty()) {
                return payload;
            } else {
                [this.value, payload] = callback(this.value, payload);
                return this.rest.walk(callback, payload);
            }
        }
    }

    return new List();

}
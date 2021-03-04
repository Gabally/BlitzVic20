function ListFactory(compare = (a,b) => (a>b)-(a<b)) {

  class List {

    // metodo costruttore, invocato con new List()
    constructor (value, rest) {
      this.value = value;
      this.rest = rest;
    }

    // È vuota la lista?
    empty () {
      return this.value === undefined;
    }

    // inserimento in testa alla lista
    push (x) {
      if (this.empty()) {
        this.value = x;
        this.rest = new List();
      } else {
        this.rest = new List(this.value, this.rest);
        this.value = x;
      }
      return this;
    }

    // rimozione dalla testa della lista
    pop () {
      if (this.empty()) {
        return undefined;
      } else {
        let x = this.value;
        this.value = this.rest.value;
        this.rest = this.rest.rest;
        return x;
      }
    }

    // aggiunta in coda alla lista
    enqueue (x) {
      if (this.empty()) {
        this.value = x;  // creo la testa (elemento)
        this.rest = new List();  // seguito da una nuova lista (vuota)
      } else {
        this.rest.enqueue(x);  // accodo al resto
      }
      return this;
    }

    // rimozione dal fondo della lista
    dequeue () {
      if (this.empty()) {
        return undefined;
      } else if (this.rest.empty()) {
        return this.pop();
      } else {
        return this.rest.dequeue();
      }
    }

    // dimensione della lista
    size () {
      if (this.empty()) {
        return 0;
      } else {
        return 1 + this.rest.size();
      }
    }

    // rappresentazione in testo della lista
    toString () {
      if (!this.empty()) {
        console.log(this.value);
        this.rest.toString();
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    // Metodi che dipendo dal tipo di elemento, è richiesta una funzione
    // di confronto

    // verifica esistenza di un elemento nella lista
    exists (x, c = compare) {
      if (this.empty()) {
        return false;
      } else if (c(this.value, x) == 0) {
        return true;
      } else {
        return this.rest.exists(x, c);
      }
    }

    // posizione del primo elemento nella lista
    indexOf (x, c = compare) {
      if (this.empty()) {
        return -1;
      } else if (c(this.value, x) == 0) {
        return 0;
      } else {
        let n = this.rest.indexOf(x, c);
        return n < 0 ? n : n + 1;
      }
    }

    // occorrenze di un elemento nella lista
    count (x, c = compare) {
      if (this.empty()) {
        return 0;
      } else {
        return (c(this.value, x) == 0) + this.rest.count(x, c);
      }
    }

    // inserimento ordinato
    sortedInsert(x, c = compare) {
      // avendo la lista ordinata
      // inserisce nella posizione giusta (la lista resta ordinata)
      if (this.empty() || c(x, this.value) < 1) {
        this.push(x);
      } else {
        this.rest.sortedInsert(x, c);
      }
      return this;
    }

    // ordinamento della lista
    sort(c = compare) {
      // ordinamento con QuickSort (che è appunto ricorsivo)
      if (!this.empty() && !this.rest.empty()) {
        let h = this.pop();
        let [min, max] = this.separate(h, c);
        /*
        min.sort(c);
        max.sort(c);
        max.push(h);
        min.catenate(max);
        this.catenate(min);
        */
        this.catenate(min.sort(c)).catenate(max.sort(c).push(h));
      }
      return this;
    }

    // funzione di servizio dell'ordinamento
    separate (x, c = compare) {
      if (this.empty()) {
        return [new List(), new List()];
      } else {
        let h = this.pop();
        // attenzione l è il resto, visto che ho tolto la testa con pop
        let [min, max] = this.separate(x, c);
        if (c(h, x) < 1) {
          min.push(h);
        } else {
          max.push(h);
        }
        return [min, max];
      }
    }

    // concatenamento di una lista
    catenate (l) {
      if (this.empty()) {
        this.value = l.value;
        this.rest = l.rest;
      } else {
        this.rest.catenate(l);
      }
      return this;
    }

    // attraversamento con callback
    visit (callback) {
      if (!this.empty()) {
        callback(this.value);
        this.rest.visit(callback);
      }
      return this;
    }

    // attraversamento con callback e accumulo
    reduce (callback, payload) {
      if (this.empty()) {
        return payload;
      } else {
        payload = callback(this.value, payload);
        return this.rest.reduce(callback, payload);
      }
    }

    // attraversamento con callback e modifica elementi lista
    map (callback) {
      if (!this.empty()) {
        this.value = callback(this.value);
        this.rest.map(callback);
      }
      return this;
    }

    // attraversamento con callback, modifica elementi lista e accumulo
    walk (callback, payload) {
      if (this.empty()) {
        return payload;
      } else {
        [this.value, payload] = callback(this.value, payload);
        return this.rest.walk(callback, payload);
      }
    }

    // filter
    filter () {

    }

    // elimina i doppioni
    // uniq
  }

  return new List();

}
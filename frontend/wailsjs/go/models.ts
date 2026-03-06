export namespace models {
	
	export class Expense {
	    id: number;
	    trip_id: number;
	    name: string;
	    category: string;
	    amount: number;
	    currency: string;
	    note: string;
	
	    static createFrom(source: any = {}) {
	        return new Expense(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.trip_id = source["trip_id"];
	        this.name = source["name"];
	        this.category = source["category"];
	        this.amount = source["amount"];
	        this.currency = source["currency"];
	        this.note = source["note"];
	    }
	}
	export class ExpenseInput {
	    name: string;
	    category: string;
	    amount: number;
	    currency: string;
	    note: string;
	
	    static createFrom(source: any = {}) {
	        return new ExpenseInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.category = source["category"];
	        this.amount = source["amount"];
	        this.currency = source["currency"];
	        this.note = source["note"];
	    }
	}
	export class Link {
	    id: number;
	    trip_id: number;
	    name: string;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new Link(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.trip_id = source["trip_id"];
	        this.name = source["name"];
	        this.url = source["url"];
	    }
	}
	export class LinkInput {
	    name: string;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new LinkInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.url = source["url"];
	    }
	}
	export class Note {
	    id: number;
	    trip_id: number;
	    title: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new Note(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.trip_id = source["trip_id"];
	        this.title = source["title"];
	        this.content = source["content"];
	    }
	}
	export class NoteInput {
	    title: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new NoteInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.content = source["content"];
	    }
	}
	export class Photo {
	    id: number;
	    trip_id: number;
	    filename: string;
	    caption: string;
	
	    static createFrom(source: any = {}) {
	        return new Photo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.trip_id = source["trip_id"];
	        this.filename = source["filename"];
	        this.caption = source["caption"];
	    }
	}
	export class Trip {
	    id: number;
	    name: string;
	    destination: string;
	    start_date: string;
	    end_date: string;
	    trip_type: string;
	    need_visa: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Trip(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.destination = source["destination"];
	        this.start_date = source["start_date"];
	        this.end_date = source["end_date"];
	        this.trip_type = source["trip_type"];
	        this.need_visa = source["need_visa"];
	    }
	}
	export class TripInput {
	    name: string;
	    destination: string;
	    start_date: string;
	    end_date: string;
	    trip_type: string;
	    need_visa: boolean;
	
	    static createFrom(source: any = {}) {
	        return new TripInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.destination = source["destination"];
	        this.start_date = source["start_date"];
	        this.end_date = source["end_date"];
	        this.trip_type = source["trip_type"];
	        this.need_visa = source["need_visa"];
	    }
	}

}


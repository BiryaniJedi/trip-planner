export namespace models {
	
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


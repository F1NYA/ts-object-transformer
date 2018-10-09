import {transformObject} from './ts-object-transformer';

describe("ts-object-transformer", () => {
    it("object transformation", () => {
        let transformedResult = transformObject(
            // Standard plain object literal coming, most of the time from serverside, generally described by an interface
            // Let's call this type SRC
            { date: "2018-10-04T00:00:00+0200", date2: 1538604000000, aString: "Hello%20World", idempotentValue: "foo" },
            // Applying some mapping aimed at converting input values above and change their type representation
            // Rules are :
            // - Keys should be a subset of SRC's keys
            // - Values should be function taking SRC[key] and returning a new type NEW_TYPE[key] we want to capture in
            // order to reference it in transformObject()'s result type
            // Let's call this type FIELD_MAP
            { date: Date.parse, date2: (ts: number) => new Date(ts), aString: unescape },
            // Generating new "computed" properties
            // Rules are :
            // - Keys cannot be one of SRC key
            // - Values should be function taking SRC[key] and returning a new type NEW_TYPE[key] we want to capture in
            // order to reference it in transformObject()'s result type
            // Let's call this type COMPUTED_MAP
            { year: (obj) => obj.date.substr(0, 4), strlen: (obj) => obj.aString.length }
        );
        // Result type (NEW_TYPE) should be a map with its keys being the union of SRC keys and COMPUTED_MAP keys with following rules :
        // - If key exists only in SRC, then NEW_TYPE[key] = SRC[key]
        // - If key is a computed key (belonging to COMPUTED_MAP), then NEW_TYPE[key] = ResultType<COMPUTED_MAP[key]>
        // - Otherwise (key existing in FIELD_MAP), then NEW_TYPE[key] = ResultType<FIELD_MAP[key]>
        // In this example, expecting
        //   mappedResult = { date: Date.parse("2018-10-04T00:00:00+0200"), date2: new Date(1538604000000), aString: unescape("Hello%20World"), idempotentValue: "foo", year: "2018", strlen: 13 }
        // ..  meaning that expected type would be { date: number, date2: Date, aString: string, idempotentValue: string, year: string, strlen: number }

        expect(Object.keys(transformedResult)).toEqual(['date', 'date2', 'aString', 'idempotentValue', 'year', 'strlen']);

        let v1: number = transformedResult.date; // number, expected
        expect(typeof v1).toEqual('number');
        expect(v1).toEqual(1538604000000);
        let v2: Date = transformedResult.date2; // Date, expected
        expect(typeof v2).toEqual('object');
        expect(v2).toBeInstanceOf(Date);
        expect(v2.getTime()).toEqual(1538604000000);
        let v3: string = transformedResult.aString; // string, expected
        expect(typeof v3).toEqual('string');
        expect(v3).toEqual('Hello World');
        let v4: string = transformedResult.idempotentValue; // string, expected
        expect(typeof v4).toEqual('string');
        expect(v4).toEqual('foo');
        let v5: string = transformedResult.year; // string, expected
        expect(typeof v5).toEqual('string');
        expect(v5).toEqual('2018');
        let v6: number = transformedResult.strlen; // number, expected
        expect(typeof v6).toEqual('number');
        expect(v6).toEqual(13);

        // transformedResult.blah // doesn't compile, Property 'blah' doesn't exist on type
    });

    it("object transformation with no computed values", () => {
        let transformedResult = transformObject(
            { date: "2018-10-04T00:00:00+0200", date2: 1538604000000, aString: "Hello%20World", idempotentValue: "foo" },
            { date: Date.parse, date2: (ts: number) => new Date(ts), aString: unescape }
        );

        expect(Object.keys(transformedResult)).toEqual(['date', 'date2', 'aString', 'idempotentValue']);

        let v1: number = transformedResult.date; // number, expected
        expect(typeof v1).toEqual('number');
        expect(v1).toEqual(1538604000000);
        let v2: Date = transformedResult.date2; // Date, expected
        expect(typeof v2).toEqual('object');
        expect(v2).toBeInstanceOf(Date);
        expect(v2.getTime()).toEqual(1538604000000);
        let v3: string = transformedResult.aString; // string, expected
        expect(typeof v3).toEqual('string');
        expect(v3).toEqual('Hello World');
        let v4: string = transformedResult.idempotentValue; // string, expected
        expect(typeof v4).toEqual('string');
        expect(v4).toEqual('foo');
        // let v5: string = transformedResult.year; // doesn't compile, property 'year' doesn't exist on type
    });

    function jsonMappingsWithFieldMappings(fieldMapping: {}|undefined) {
        let transformedResult = transformObject(
            { date: "2018-10-04T00:00:00+0200", date2: 1538604000000, aString: "Hello%20World", idempotentValue: "foo" },
            fieldMapping,
            { year: (obj) => obj.date.substr(0, 4) }
        );

        expect(Object.keys(transformedResult)).toEqual(['date', 'date2', 'aString', 'idempotentValue', 'year']);

        let v1: string = transformedResult.date; // string expected
        expect(typeof v1).toEqual('string');
        expect(v1).toEqual('2018-10-04T00:00:00+0200');
        let v2: number = transformedResult.date2; // number, expected
        expect(typeof v2).toEqual('number');
        expect(v2).toEqual(1538604000000);
        let v3: string = transformedResult.aString; // string, expected
        expect(typeof v3).toEqual('string');
        expect(v3).toEqual('Hello%20World');
        let v4: string = transformedResult.idempotentValue; // string, expected
        expect(typeof v4).toEqual('string');
        expect(v4).toEqual('foo');
        let v5: string = transformedResult.year; // string, expected
        expect(typeof v5).toEqual('string');
        expect(v5).toEqual('2018');
    }
    it("object transformation with no field mappings", () => {
        jsonMappingsWithFieldMappings({});
    });

    it("object transformation with undefined field mappings", () => {
        jsonMappingsWithFieldMappings(undefined);
    });

    it("idempotent transformation", () => {
        let transformedResult = transformObject(
            { date: "2018-10-04T00:00:00+0200", date2: 1538604000000, aString: "Hello%20World", idempotentValue: "foo" }
        );

        expect(Object.keys(transformedResult)).toEqual(['date', 'date2', 'aString', 'idempotentValue']);

        let v1: string = transformedResult.date; // string expected
        expect(typeof v1).toEqual('string');
        expect(v1).toEqual('2018-10-04T00:00:00+0200');
        let v2: number = transformedResult.date2; // number, expected
        expect(typeof v2).toEqual('number');
        expect(v2).toEqual(1538604000000);
        let v3: string = transformedResult.aString; // string, expected
        expect(typeof v3).toEqual('string');
        expect(v3).toEqual('Hello%20World');
        let v4: string = transformedResult.idempotentValue; // string, expected
        expect(typeof v4).toEqual('string');
        expect(v4).toEqual('foo');
        // let v5: string = transformedResult.year; // doesn't compile, property 'year' doesn't exist on type
    });

    interface NestedNode {
        str: string;
        num: number;
    }

    it("nested properties", () => {
        let transformedResult = transformObject(
            { nestedIdemPotent: { str: "foo", num: 123}, nestedChanged: { str: "foo", num: 123 } },
            { nestedChanged: (node: NestedNode) => transformObject(node, { str: (s: string) => s.length })}
        );

        log(transformedResult.nestedIdemPotent.str); // foo
        log(transformedResult.nestedIdemPotent.num); // 123
        // Doesn't compile, blah not found in transformedResult.nestedIdemPotent
        // log(transformedResult.nestedIdemPotent.blah);

        log(transformedResult.nestedChanged.str); // 3
        log(transformedResult.nestedChanged.num); // 123
        // Doesn't compile, blah not found in transformedResult.nestedChanged
        // log(transformedResult.nestedChanged.blah);
    });

    it('Readme examples', () => {
        let transformedResult = transformObject(
            { date: "2018-10-04T00:00:00+0200", date2: 1538604000000, aString: "Hello%20World", idempotentValue: "foo" },
            { date: Date.parse, date2: (ts: number) => new Date(ts), aString: unescape },
            { year: (obj) => obj.date.substr(0, 4) }
        );

        // Doesn't compile : Argument of type "blah" doesn't exist on type
        // let blah = transformedResult.blah;

        // Doesn't compile : "type 'Date' is not assignable to type 'number'"
        // Proves that date2 has been converted to Date
        // let num: number = transformedResult.date2;

        log(transformedResult.date); // 1538604000000
        log(transformedResult.date2); // 2018-10-03T22:00:00.000Z (new Date(1538604000000))
        log(transformedResult.aString); // Hello world
        log(transformedResult.idempotentValue); // foo
        log(transformedResult.year); // 2018

        let transformedResult2 = transformObject(
            { date: "2018-10-04T00:00:00+0200", date2: 1538604000000, aString: "Hello%20World", idempotentValue: "foo" },
            { date: Date.parse, date2: (ts: number) => new Date(ts), aString: unescape }
        );

        log(transformedResult2.date); // 1538604000000
        log(transformedResult2.date2); // 2018-10-03T22:00:00.000Z (new Date(1538604000000))
        log(transformedResult2.aString); // Hello world
        log(transformedResult2.idempotentValue); // foo

        let transformedResult3 = transformObject(
            { date: "2018-10-04T00:00:00+0200", date2: 1538604000000, aString: "Hello%20World", idempotentValue: "foo" },
            undefined,
            { year: (obj) => obj.date.substr(0, 4) }
        );
        log(transformedResult3.date); // 2018-10-04T00:00:00+0200
        log(transformedResult3.date2); // 1538604000000
        log(transformedResult3.aString); // Hello%20world
        log(transformedResult3.idempotentValue); // foo
        log(transformedResult3.year); // 2018
    });

    function log(message?: any, ...optionalParams: any[]): void {
        let logEnabled = false; // switch this in dev to enable console.log()
        if(logEnabled) {
            console.log(message, optionalParams);
        }
    }
});

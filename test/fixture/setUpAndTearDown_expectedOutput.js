/*global RestProxy, describe, beforeEach, afterEach, it, expect */
describe( "unit.persistence.RestProxy", function() {

	describe( "Test buildUrl()", function() {
		var thisSuite = {};

		beforeEach( function() {
			thisSuite.proxy = new RestProxy( {
				urlRoot : '/testUrl',
				appendId : false
			} );
		} );

		afterEach( function() {
			thisSuite.proxy.destroy();
		} );

		it( "buildUrl() should handle a urlRoot without a trailing slash", function() {
			expect( thisSuite.proxy.buildUrl( 'create', 42 ) ).toBe( '/testUrl' );  // orig YUI Test err msg: "buildUrl() should have returned the urlRoot when doing a 'create'"
			expect( thisSuite.proxy.buildUrl( 'read' ) ).toBe( '/testUrl' );  // orig YUI Test err msg: "buildUrl() should have not appended the ID when doing a 'read' of a collection (i.e. no particular ID to read)"
			expect( thisSuite.proxy.buildUrl( 'read', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'read'"
			expect( thisSuite.proxy.buildUrl( 'update', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'update'"
			expect( thisSuite.proxy.buildUrl( 'delete', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'delete'"
		} );


		it( "buildUrl() should handle a urlRoot with a trailing slash", function() {
			expect( thisSuite.proxy.buildUrl( 'create', 42 ) ).toBe( '/testUrl/' );  // orig YUI Test err msg: "buildUrl() should have returned the urlRoot when doing a 'create'"
			expect( thisSuite.proxy.buildUrl( 'read' ) ).toBe( '/testUrl/' );  // orig YUI Test err msg: "buildUrl() should have not appended the ID when doing a 'read' of a collection (i.e. no particular ID to read)"
			expect( thisSuite.proxy.buildUrl( 'read', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'read'"
			expect( thisSuite.proxy.buildUrl( 'update', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'update'"
			expect( thisSuite.proxy.buildUrl( 'delete', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'delete'"
		} );

	} );

} );
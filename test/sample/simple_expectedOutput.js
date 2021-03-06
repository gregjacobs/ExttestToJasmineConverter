/*global RestProxy, _, describe, beforeEach, afterEach, it, expect */
describe( "unit.persistence.RestProxy", function() {
	
	describe( "Test buildUrl()", function() {
		
		it( "buildUrl() should handle a urlRoot without a trailing slash", function() {
			var proxy = new RestProxy( {
				urlRoot : '/testUrl',
				appendId : false
			} );
			
			expect( proxy.buildUrl( 'create', 42 ) ).toBe( '/testUrl' );  // orig YUI Test err msg: "buildUrl() should have returned the urlRoot when doing a 'create'"
			expect( proxy.buildUrl( 'read' ) ).toBe( '/testUrl' );  // orig YUI Test err msg: "buildUrl() should have not appended the ID when doing a 'read' of a collection (i.e. no particular ID to read)"
			expect( proxy.buildUrl( 'read', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'read'"
			expect( proxy.buildUrl( 'update', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'update'"
			expect( proxy.buildUrl( 'delete', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'delete'"
		} );
		
		
		it( "buildUrl() should handle a urlRoot with a trailing slash", function() {
			var proxy = new RestProxy( {
				urlRoot : '/testUrl/',
				appendId : false
			} );
			
			expect( proxy.buildUrl( 'create', 42 ) ).toBe( '/testUrl/' );  // orig YUI Test err msg: "buildUrl() should have returned the urlRoot when doing a 'create'"
			expect( proxy.buildUrl( 'read' ) ).toBe( '/testUrl/' );  // orig YUI Test err msg: "buildUrl() should have not appended the ID when doing a 'read' of a collection (i.e. no particular ID to read)"
			expect( proxy.buildUrl( 'read', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'read'"
			expect( proxy.buildUrl( 'update', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'update'"
			expect( proxy.buildUrl( 'delete', 42 ) ).toBe( '/testUrl/42' );  // orig YUI Test err msg: "buildUrl() should have appended the ID when doing a 'delete'"
		} );
		
	} );
	
} );
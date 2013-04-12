/*global RestProxy, _, describe, beforeEach, afterEach, it, expect */
describe( "unit.persistence.RestProxy", function() {
	
	describe( "Test buildUrl()", function() {
		
		function myHelper( arg1 ) {
			return arg1 + 1;
		}
		
		
		function myHelper2( arg1, arg2 ) {
			return arg1 + arg2;
		}
		
		
		it( "it should do something", function() {
			myHelper();
			myHelper2();
		} );
		
		
		it( "it should do something else", function() {
			var a = myHelper();
			var b = myHelper2();
		} );
		
	} );
	
} );
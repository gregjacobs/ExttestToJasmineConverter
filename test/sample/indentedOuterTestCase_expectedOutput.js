/*global define, window, _, describe, beforeEach, afterEach, it, expect, JsMockito */
define( [
	'data/ModelCache'
], function( ModelCache ) {
	
	describe( "unit.data.ModelCache", function() {
		var thisSuite;
		
		beforeEach( function() {
			thisSuite = {};
			
			thisSuite.MockModel1 = function() {};
			thisSuite.MockModel1.__Data_modelTypeId = "1";
			
			thisSuite.MockModel2 = function() {};
			thisSuite.MockModel2.__Data_modelTypeId = "2";
			
			// Reset the ModelCache between tests
			ModelCache.models = {};
		} );
		
		afterEach( function() {
			// Reset the ModelCache on tearDown as well, so we don't affect other tests
			ModelCache.models = {};
		} );
		
		
		it( "get() should return a reference to the same model provided to it if not providing an id", function() {
			var model = new thisSuite.MockModel1();
			
			var retrievedModel = ModelCache.get( model );
			expect( retrievedModel ).toBe( model );
		} );
		
		
		it( "get() should *not* return a reference to the first model, when a second one is passed in with the same type (subclass), but not passing in any id's", function() {
			var model1 = new thisSuite.MockModel1(),
			    model2 = new thisSuite.MockModel1();
			
			var retrievedModel1 = ModelCache.get( model1 );
			var retrievedModel2 = ModelCache.get( model2 );
			
			expect( retrievedModel2 ).not.toBe( retrievedModel1 );
		} );
		
		
		it( "get() should return a reference to the first model, when a second one is passed with the same id", function() {
			var model1 = new thisSuite.MockModel1();
			var model2 = new thisSuite.MockModel1();
			
			var retrievedModel1 = ModelCache.get( model1, 1 );  // same id of
			var retrievedModel2 = ModelCache.get( model2, 1 );  // 1 on both
			
			expect( retrievedModel2 ).toBe( retrievedModel1 );
		} );
		
		
		it( "get() should *not* return a reference to the first model, when a second one is passed with the same id, but of a different model type (subclass)", function() {
			var model1 = new thisSuite.MockModel1(),
			    model2 = new thisSuite.MockModel2();
			
			var retrievedModel1 = ModelCache.get( model1, 1 );  // same id of 1 on both,
			var retrievedModel2 = ModelCache.get( model2, 1 );  // but different types of models
			
			expect( retrievedModel2 ).not.toBe( retrievedModel1 );
		} );
		
		
		it( "get() should *not* return a reference to the first model, when a second one is passed with the same type (subclass), but with a different id", function() {
			var model1 = new thisSuite.MockModel1(),
			    model2 = new thisSuite.MockModel1();
			
			var retrievedModel1 = ModelCache.get( model1, 1 );  // same type on both,
			var retrievedModel2 = ModelCache.get( model2, 2 );  // but different id's
			
			expect( retrievedModel2 ).not.toBe( retrievedModel1 );
		} );
		
	} );
} );
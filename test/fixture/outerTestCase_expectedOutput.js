/*global Class, ui, _, describe, beforeEach, afterEach, it, expect */
/*jshint browser:true */
describe( "unit.ui.formFields.AbstractField", function() {
	var thisSuite = {};
	
	beforeEach( function() {
		// An AbstractField with implemented setValue() and getValue() methods used for testing.
		thisSuite.TestAbstractField = Class.extend( ui.formFields.AbstractField, {
			setValue : function( val ) { thisSuite.value = val; },
			getValue : function() { return thisSuite.value; }
		} );
	} );
	
	
	it( "The 'value' should be undefined if it was not provided", function() {
		for( var rendered = 0; rendered <= 1; rendered++ ) {
			var field = new thisSuite.TestAbstractField( {
				renderTo: ( rendered ) ? document.body : undefined
				// value: "my value"             -- intentionally leaving this here
			} );
			
			expect( _.isUndefined( field.getValue() ) ).toBe( true );  // orig YUI Test err msg: "the initial value should be undefined. rendered = " + !!rendered
			
			field.destroy();  // clean up
		}
	} );
	
} );
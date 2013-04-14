/*global app, _, describe, beforeEach, afterEach, it, expect */
describe( "unit.app.components.controls.FontFaceDropdown", function() {
	
	it( "The initial value should transform a css font-face string into a single value, taking the first font face out of a list, and handling quote characters", function() {
		for( var rendered = 0; rendered <= 1; rendered++ ) {
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined,
				value: 'Bevan'
			} );
			expect( fontFaceDropdown.getValue() ).toBe( 'Bevan' );  // orig YUI Test err msg: "initial value with an exact font face name should have set the value. rendered = " + !!rendered
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined,
				value: "'Bevan'"
			} );
			expect( fontFaceDropdown.getValue() ).toBe( "Bevan" );  // orig YUI Test err msg: "initial value with single quotes should have set the value without the quotes. rendered = " + !!rendered
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined,
				value: '"Bevan"'
			} );
			expect( fontFaceDropdown.getValue() ).toBe( "Bevan" );  // orig YUI Test err msg: "initial value with double quotes should have set the value without the quotes. rendered = " + !!rendered
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined,
				value: 'Bevan, arial, serif'
			} );
			expect( fontFaceDropdown.getValue() ).toBe( 'Bevan' );  // orig YUI Test err msg: "initial value with a list of font faces should have set the value to the first. rendered = " + !!rendered
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined,
				value: "'Bevan', arial, serif"
			} );
			expect( fontFaceDropdown.getValue() ).toBe( 'Bevan' );  // orig YUI Test err msg: "initial value with a list of font faces, with single quotes, should have set the value to the first without the quotes. rendered = " + !!rendered
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined,
				value: '"Bevan", arial, serif'
			} );
			expect( fontFaceDropdown.getValue() ).toBe( 'Bevan' );  // orig YUI Test err msg: "initial value with a list of font faces, with double quotes, should have set the value to the first without the quotes. rendered = " + !!rendered
			fontFaceDropdown.destroy();  // clean up
		}
	} );
	
	
	it( "setValue() should transform a css font-face string into a single value, taking the first font face out of a list, and handling quote characters", function() {
		for( var rendered = 0; rendered <= 1; rendered++ ) {
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined
			} );
			fontFaceDropdown.setValue( 'Bevan' );
			expect( fontFaceDropdown.getValue() ).toBe( 'Bevan' );  // orig YUI Test err msg: "Setting to an exact font face name should have set the value. rendered = " + !!rendered
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined
			} );
			fontFaceDropdown.setValue( "'Bevan'" );
			expect( fontFaceDropdown.getValue() ).toBe( "Bevan" );  // orig YUI Test err msg: "Setting with single quotes should have set the value without the quotes. rendered = " + !!rendered
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined
			} );
			fontFaceDropdown.setValue( '"Bevan"' );
			expect( fontFaceDropdown.getValue() ).toBe( "Bevan" );  // orig YUI Test err msg: "Setting with double quotes should have set the value without the quotes. rendered = " + !!rendered
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined
			} );
			fontFaceDropdown.setValue( 'Bevan, arial, serif' );
			expect( fontFaceDropdown.getValue() ).toBe( 'Bevan' );  // orig YUI Test err msg: "Setting with a list of font faces should have set the value to the first. rendered = " + !!rendered
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined
			} );
			fontFaceDropdown.setValue( "'Bevan', arial, serif" );
			expect( fontFaceDropdown.getValue() ).toBe( 'Bevan' );  // orig YUI Test err msg: "Setting with a list of font faces, with single quotes, should have set the value to the first without the quotes. rendered = " + !!rendered
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined
			} );
			fontFaceDropdown.setValue( '"Bevan", arial, serif' );
			expect( fontFaceDropdown.getValue() ).toBe( 'Bevan' );  // orig YUI Test err msg: "Setting with a list of font faces, with double quotes, should have set the value to the first without the quotes. rendered = " + !!rendered
			fontFaceDropdown.destroy();  // clean up
		}
	} );
	
} );
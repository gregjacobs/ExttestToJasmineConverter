/*global Ext, Y, tests, app */
tests.unit.app.components.controls.add( new Ext.test.TestSuite( {
	
	name: 'FontFaceDropdown',
	
	
	// ----------------------------------
	
	
	"The initial value should transform a css font-face string into a single value, taking the first font face out of a list, and handling quote characters" : function() {
		for( var rendered = 0; rendered <= 1; rendered++ ) {
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined,
				value: 'Bevan'
			} );
			Y.Assert.areSame( 'Bevan', fontFaceDropdown.getValue(), "initial value with an exact font face name should have set the value. rendered = " + !!rendered );
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined,
				value: "'Bevan'"
			} );
			Y.Assert.areSame( "Bevan", fontFaceDropdown.getValue(), "initial value with single quotes should have set the value without the quotes. rendered = " + !!rendered );
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined,
				value: '"Bevan"'
			} );
			Y.Assert.areSame( "Bevan", fontFaceDropdown.getValue(), "initial value with double quotes should have set the value without the quotes. rendered = " + !!rendered );
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined,
				value: 'Bevan, arial, serif'
			} );
			Y.Assert.areSame( 'Bevan', fontFaceDropdown.getValue(), "initial value with a list of font faces should have set the value to the first. rendered = " + !!rendered );
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined,
				value: "'Bevan', arial, serif"
			} );
			Y.Assert.areSame( 'Bevan', fontFaceDropdown.getValue(), "initial value with a list of font faces, with single quotes, should have set the value to the first without the quotes. rendered = " + !!rendered );
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined,
				value: '"Bevan", arial, serif'
			} );
			Y.Assert.areSame( 'Bevan', fontFaceDropdown.getValue(), "initial value with a list of font faces, with double quotes, should have set the value to the first without the quotes. rendered = " + !!rendered );
			fontFaceDropdown.destroy();  // clean up
		}
	},
	
	
	"setValue() should transform a css font-face string into a single value, taking the first font face out of a list, and handling quote characters" : function() {
		for( var rendered = 0; rendered <= 1; rendered++ ) {
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined
			} );
			fontFaceDropdown.setValue( 'Bevan' );
			Y.Assert.areSame( 'Bevan', fontFaceDropdown.getValue(), "Setting to an exact font face name should have set the value. rendered = " + !!rendered );
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined
			} );
			fontFaceDropdown.setValue( "'Bevan'" );
			Y.Assert.areSame( "Bevan", fontFaceDropdown.getValue(), "Setting with single quotes should have set the value without the quotes. rendered = " + !!rendered );
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined
			} );
			fontFaceDropdown.setValue( '"Bevan"' );
			Y.Assert.areSame( "Bevan", fontFaceDropdown.getValue(), "Setting with double quotes should have set the value without the quotes. rendered = " + !!rendered );
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined
			} );
			fontFaceDropdown.setValue( 'Bevan, arial, serif' );
			Y.Assert.areSame( 'Bevan', fontFaceDropdown.getValue(), "Setting with a list of font faces should have set the value to the first. rendered = " + !!rendered );
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined
			} );
			fontFaceDropdown.setValue( "'Bevan', arial, serif" );
			Y.Assert.areSame( 'Bevan', fontFaceDropdown.getValue(), "Setting with a list of font faces, with single quotes, should have set the value to the first without the quotes. rendered = " + !!rendered );
			fontFaceDropdown.destroy();  // clean up
			
			var fontFaceDropdown = new app.components.controls.fonts.FontFaceDropdown( {
				renderTo: ( rendered ) ? document.body : undefined
			} );
			fontFaceDropdown.setValue( '"Bevan", arial, serif' );
			Y.Assert.areSame( 'Bevan', fontFaceDropdown.getValue(), "Setting with a list of font faces, with double quotes, should have set the value to the first without the quotes. rendered = " + !!rendered );
			fontFaceDropdown.destroy();  // clean up
		}
	}
	
} ) );
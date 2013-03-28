/*global require, __dirname, describe, xdescribe, beforeEach, afterEach, it, xit */
var expect    = require( 'chai' ).expect,
    fs        = require( 'fs' ),
    Converter = require( '../src/Converter' );

describe( "Converter", function() {
	var converter;
	
	beforeEach( function() {
		converter = new Converter();
	} );
	
	describe( "convertJsHintGlobals()", function() {
		
		it( "should add the Lo-Dash and the Jasmine globals to the input string when none are present", function() {
			var input = "test test test",
			    output = converter.convertJsHintGlobals( input );
			
			expect( output ).to.equal( "/*global _, describe, beforeEach, afterEach, it, expect */\n" + input );
		} );
		
		
		it( "should modify existing globals, removing 'Ext', 'Y', and 'tests' globals, and adding the Lo-Dash / Jasmine ones", function() {
			var input = "/*global window, jQuery, Ext, Y, tests */\ntest test test",
			    output = converter.convertJsHintGlobals( input );
			
			expect( output ).to.equal( "/*global window, jQuery, _, describe, beforeEach, afterEach, it, expect */\ntest test test" );
		} );
		
		
		it( "should modify existing globals, removing 'Ext', 'Y', and 'tests' globals, and adding Jasmine ones, leaving the Lo-Dash global alone if it exists", function() {
			var input = "/*global window, _, jQuery, Ext, Y, tests */\ntest test test",
			    output = converter.convertJsHintGlobals( input );
			
			expect( output ).to.equal( "/*global window, jQuery, _, describe, beforeEach, afterEach, it, expect */\ntest test test" );
		} );
		
		
		it( "should modify existing globals, removing 'Ext', 'Y', and 'tests' globals, adding Jasmine ones, and moving JsMockito to the end of the list if present", function() {
			var input = "/*global window, jQuery, _, Ext, Y, JsMockito, tests */\ntest test test",
			    output = converter.convertJsHintGlobals( input );
			
			expect( output ).to.equal( "/*global window, jQuery, _, describe, beforeEach, afterEach, it, expect, JsMockito */\ntest test test" );
		} );
		
	} );
	
	
	
	// -----------------------------------------------
	
	
	describe( "complete conversion tests", function() {
	
		it( "should convert a fairly simple Ext.Test file", function() {
			var input = fs.readFileSync( __dirname + '/sample/simple_input.js', 'utf8' ),
			    expectedOutput = fs.readFileSync( __dirname + '/sample/simple_expectedOutput.js', 'utf8' );
			
			// Strip all carriage returns off of the input and expected output. They needlessly get in the way.
			input = input.replace( /\r/g, '' );
			expectedOutput = expectedOutput.replace( /\r/g, '' );
			
			var convertedInput = converter.convert( input );
			expect( convertedInput ).to.equal( expectedOutput );
		} );
	
		
		it( "should convert JsMockito try/catch blocks in a file", function() {
			var input = fs.readFileSync( __dirname + '/sample/jsMockitoTests_input.js', 'utf8' ),
			    expectedOutput = fs.readFileSync( __dirname + '/sample/jsMockitoTests_expectedOutput.js', 'utf8' );
			
			// Strip all carriage returns off of the input and expected output. They needlessly get in the way.
			input = input.replace( /\r/g, '' );
			expectedOutput = expectedOutput.replace( /\r/g, '' );
			
			var convertedInput = converter.convert( input );
			expect( convertedInput ).to.equal( expectedOutput );
		} );
	
		
		it( "should convert setUp() and tearDown() methods in a file", function() {
			var input = fs.readFileSync( __dirname + '/sample/setUpAndTearDown_input.js', 'utf8' ),
			    expectedOutput = fs.readFileSync( __dirname + '/sample/setUpAndTearDown_expectedOutput.js', 'utf8' );
			
			// Strip all carriage returns off of the input and expected output. They needlessly get in the way.
			input = input.replace( /\r/g, '' );
			expectedOutput = expectedOutput.replace( /\r/g, '' );
			
			var convertedInput = converter.convert( input );
			expect( convertedInput ).to.equal( expectedOutput );
		} );
	
		
		it( "should convert a file with an outer TestCase (instead of an outer Suite)", function() {
			var input = fs.readFileSync( __dirname + '/sample/outerTestCase_input.js', 'utf8' ),
			    expectedOutput = fs.readFileSync( __dirname + '/sample/outerTestCase_expectedOutput.js', 'utf8' );
			
			// Strip all carriage returns off of the input and expected output. They needlessly get in the way.
			input = input.replace( /\r/g, '' );
			expectedOutput = expectedOutput.replace( /\r/g, '' );
			
			var convertedInput = converter.convert( input );
			expect( convertedInput ).to.equal( expectedOutput );
		} );
	
		
		it( "should convert a file with an indented outer TestCase", function() {
			var input = fs.readFileSync( __dirname + '/sample/indentedOuterTestCase_input.js', 'utf8' ),
			    expectedOutput = fs.readFileSync( __dirname + '/sample/indentedOuterTestCase_expectedOutput.js', 'utf8' );
			
			var convertedInput = converter.convert( input );
			expect( convertedInput ).to.equal( expectedOutput );
		} );
	
	} );
	
} );
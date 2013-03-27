/*global require, module */
var _ = require( 'lodash' ),
    Class = require( './Class' ),
    SuiteNode = require( './node/Suite' ),
    TestCaseNode = require( './node/TestCase' );


/**
 * @class TransformNodeVisitor
 * 
 * Writes out the Jasmine code for the given top level {@link node.Suite Suite} node,
 * using the {@link #write} method.
 */
var JasmineWriter = Class.extend( Object, {
	
	/**
	 * @cfg {String} indentStr
	 * 
	 * The string to use to indent. Defaults to a tab character, which is the character
	 * that anyone who really knows what they are doing uses to indent code ;)
	 */
	indentStr : '\t',
	
	/**
	 * @cfg {Number} indentLevel
	 * 
	 * The initial indent level.
	 */
	indentLevel : 0,
	
	
	/**
	 * @protected
	 * @property {String[]} output
	 * 
	 * String builder used to record the result of the transformation. Accessible via {@link #getOutput}.
	 */
	
	
	/**
	 * @constructor
	 * @param {Object} cfg The configuration options for this class.
	 */
	constructor : function( cfg ) {
		_.assign( this, cfg );
	},
	
	
	/**
	 * Writes the Jasmine output given the top level {@link node.Suite Suite} node.
	 * 
	 * @param {node.Suite/node.TestCase} outerNode The top level Suite or TestCase node to start at.
	 * @return {String} The output.
	 */
	write : function( outerNode ) {
		var outputBuffer = [];
		
		if( outerNode instanceof SuiteNode ) {
			this.appendSuite( outerNode, outputBuffer );
		} else if( outerNode instanceof TestCaseNode ) {
			this.appendTestCase( outerNode, outputBuffer );
		} else {
			throw new Error( "A `Suite` or `TestCase` node was not passed in to write()" );
		}
		
		return outputBuffer.join( "\n" );
	},
	
	
	/**
	 * Appends a string of output (which will be on a new line), automatically prepending
	 * the appropriate indent (based on the {@link #indentLevel}).
	 * 
	 * If a multiline string is passed to the `str` param, each line will receive the current
	 * level of indent.
	 * 
	 * @protected
	 * @param {String} str The line of output to append.
	 * @param {String[]} buffer The output buffer to append to.
	 */
	appendOutput : function( str, buffer ) {
		var indent = "", indentStr = this.indentStr;
		for( var i = 0, len = this.indentLevel; i < len; i++ ) {
			indent += indentStr;
		}
		
		// If the string was a multiline string, go through each line and add the indent level
		// (This also adds the indent level for a single line string as well)
		str = str
			.split( '\n' )
			.map( function( line ) {
				return indent + line;
			} )
			.join( '\n' );
		
		buffer.push( str );
	},
	
	
	// -----------------------------------
	
	
	/**
	 * Appends a {@link node.Suite Suite} node to the output.
	 * 
	 * @protected
	 * @param {node.Suite} suiteNode
	 * @param {String[]} buffer The output buffer to append to.
	 */
	appendSuite : function( suiteNode, buffer ) {
		this.appendOutput( 'describe( "' + suiteNode.getName() + '", function() {', buffer );
		this.indentLevel++;
		
		suiteNode.getChildren().forEach( function( childNode ) {
			this.appendOutput( '', buffer );  // will result in appending a line break
			
			if( childNode instanceof SuiteNode ) {
				this.appendSuite( childNode, buffer );
			} else if( childNode instanceof TestCaseNode ) {
				this.appendTestCase( childNode, buffer );
			}
			
			this.appendOutput( '', buffer );  // will result in appending a line break
		}, this );
		
		this.indentLevel--;
		this.appendOutput( '} );', buffer );
	},
	
	
	/**
	 * Appends a {@link node.TestCase TestCase} node to the output.
	 * 
	 * @protected
	 * @param {node.TestCase} testCaseNode
	 * @param {String[]} buffer The output buffer to append to.
	 */
	appendTestCase : function( testCaseNode, buffer ) {
		this.appendOutput( 'describe( "' + testCaseNode.getName() + '", function() {', buffer );
		this.indentLevel++;
		
		var should = testCaseNode.getShould(),
		    setUp = testCaseNode.getSetUp(),
		    tearDown = testCaseNode.getTearDown(),
		    tests = testCaseNode.getTests();
		
		if( setUp ) {
			this.appendSetUp( setUp, buffer );
			this.appendOutput( '', buffer );  // will result in appending a line break
		}
		if( tearDown ) {
			this.appendTearDown( tearDown, buffer );
			this.appendOutput( '', buffer );  // will result in appending a line break
		}
		tests.forEach( function( test ) {
			this.appendOutput( '', buffer );  // will result in appending a line break
			this.appendTest( test, should, buffer );
			this.appendOutput( '', buffer );  // will result in appending a line break
		}, this );
		
		this.indentLevel--;
		this.appendOutput( '} );', buffer );
	},
	
	
	/**
	 * Appends a {@link node.SetUp SetUp} node.
	 * 
	 * @protected
	 * @param {node.SetUp} setUpNode
	 * @param {String[]} buffer The output buffer to append to.
	 */
	appendSetUp : function( setUpNode, buffer ) {
		this.appendOutput( 'var thisSuite = {};', buffer );
		this.appendOutput( '', buffer );
		
		this.appendOutput( 'beforeEach( function() {', buffer );
		this.indentLevel++;
		
		this.appendOutput( setUpNode.getBody(), buffer );
		
		this.indentLevel--;
		this.appendOutput( '} );', buffer );
	},
	
	
	/**
	 * Appends a {@link node.TearDown TearDown} node.
	 * 
	 * @protected
	 * @param {node.TearDown} tearDownNode
	 * @param {String[]} buffer The output buffer to append to.
	 */
	appendTearDown : function( tearDownNode, buffer ) {
		this.appendOutput( 'afterEach( function() {', buffer );
		this.indentLevel++;
		
		this.appendOutput( tearDownNode.getBody(), buffer );
		
		this.indentLevel--;
		this.appendOutput( '} );', buffer );
	},
	
	
	/**
	 * Appends a {@link node.Test Test} node, using the context of a {@link node.Should Should} node.
	 * 
	 * @protected
	 * @param {node.Test} testNode
	 * @param {node.Should} shouldNode
	 * @param {String[]} buffer The output buffer to append to.
	 */
	appendTest : function( testNode, shouldNode, buffer ) {
		var testName = testNode.getName(),
		    ignoredTests = ( shouldNode ) ? shouldNode.getIgnoredTests() : {},
		    shouldErrorTests = ( shouldNode ) ? shouldNode.getErrorTests() : {},
		    itStr = ( ignoredTests[ testName ] ) ? 'xit' : 'it';
		
		this.appendOutput( itStr + '( "' + testNode.getName() + '", function() {', buffer );
		this.indentLevel++;
		
		if( shouldErrorTests[ testName ] ) {
			// If the test was a "should error" test in Ext.Test, wrap it in
			// an `expect( function(){ [testBody] } ).toThrow( "..." );`
			this.appendOutput( 'expect( function() {', buffer );
			this.indentLevel++;
			
			this.appendOutput( testNode.getBody(), buffer );
			
			this.indentLevel--;
			this.appendOutput( '} ).toThrow( "' + shouldErrorTests[ testName ] + '" );', buffer );
			
		} else {
			this.appendOutput( testNode.getBody(), buffer );
		}
		
		this.indentLevel--;
		this.appendOutput( '} );', buffer );
	}
	
} );

module.exports = JasmineWriter;
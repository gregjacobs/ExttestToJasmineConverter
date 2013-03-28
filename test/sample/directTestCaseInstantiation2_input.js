/*global window, jQuery, Ext, Y, JsMockito, tests, Class, _, Kevlar, Jux, ui, app */
app.controllers.quark.edit.AbstractSlideshowTest = Class.extend( app.controllers.quark.edit.QuarkTest, {
	
	setUp : function() {
		this._super();
		
		// A concrete subclass for testing with empty implementations for abstract methods
		this.AbstractSlideshow = app.controllers.quark.edit.AbstractSlideshow.extend( {
			createSlideModel : function() { return JsMockito.mock( app.models.Slide ); },
			createSlideSelectorItem : function() { return JsMockito.mock( app.views.palette.controls.carousel.CarouselItem.extend( { constructor: function(){} } ) ); }  // constructorless subclass
		} );
		
		
		// The slides collection
		this.slidesCollection = JsMockito.mock( app.collections.Slides );
		JsMockito.when( this.model ).get( 'slides' ).thenReturn( this.slidesCollection );
		
		// Create the mock panels and controls needed for the AbstractSlideshow
		this.carousel = JsMockito.mock( app.views.palette.controls.carousel.Carousel );
		this.slidesItemSelector = JsMockito.mock( app.components.controls.itemSelector.ItemSelector );
		JsMockito.when( this.carousel ).getItemSelector().thenReturn( this.slidesItemSelector );
		
		this.slideEditPanelContainer = JsMockito.mock( ui.Container );
		this.slideEditPanelContainerLayout = JsMockito.mock( ui.layout.CardsLayout );
		JsMockito.when( this.slideEditPanelContainer ).getLayout().thenReturn( this.slideEditPanelContainerLayout );
		
		this.titleSlideEditPanel = JsMockito.mock( ui.Container );
		this.generalSlideEditPanel = JsMockito.mock( ui.Container );
		
		this.slideTitleField = JsMockito.mock( ui.formFields.TextField );
		this.pictureSelector = JsMockito.mock( app.components.controls.PictureSelector );
		this.slideTitleField = JsMockito.mock( ui.formFields.TextField );
		this.slideDescriptionField = JsMockito.mock( ui.formFields.TextField );
		this.pictureSizeSelector = JsMockito.mock( app.components.controls.itemSelector.ItemSelector );
		this.layoutSelector = JsMockito.mock( app.components.controls.itemSelector.ItemSelector );
		
		
		
		// Set up the Palette to retrieve the controls that need to be retrieved
		JsMockito.when( this.controlsPanel ).findById( 'carousel' ).thenReturn( this.carousel );
		
		JsMockito.when( this.controlsPanel ).findById( 'slideEditPanelContainer' ).thenReturn( this.slideEditPanelContainer );
		JsMockito.when( this.controlsPanel ).findById( 'titleSlideEditPanel' ).thenReturn( this.titleSlideEditPanel );
		JsMockito.when( this.controlsPanel ).findById( 'generalSlideEditPanel' ).thenReturn( this.generalSlideEditPanel );
		
		JsMockito.when( this.controlsPanel ).findByKey( 'title' ).thenReturn( this.slideTitleField );
		JsMockito.when( this.controlsPanel ).findById( 'slidesItemSelector' ).thenReturn( this.slidesItemSelector );
		JsMockito.when( this.controlsPanel ).findById( 'pictureSelector' ).thenReturn( this.pictureSelector );
		JsMockito.when( this.controlsPanel ).findById( 'slideTitleField' ).thenReturn( this.slideTitleField );
		JsMockito.when( this.controlsPanel ).findById( 'slideDescriptionField' ).thenReturn( this.slideDescriptionField );
		JsMockito.when( this.controlsPanel ).findById( 'pictureSizeSelector' ).thenReturn( this.pictureSizeSelector );
		JsMockito.when( this.controlsPanel ).findById( 'layoutSelector' ).thenReturn( this.layoutSelector );
		
		
		// A mock Slide model for tests to work with
		this.slideModel = JsMockito.mock( app.models.Slide );
		JsMockito.when( this.slidesCollection ).getModels().thenReturn( [ this.slideModel ] );
		
		this.picture = JsMockito.mock( app.models.PictureWithOptions );  // and a Picture for the model
		JsMockito.when( this.slideModel ).get( 'picture' ).thenReturn( this.picture );
		
		// And a mock slide Item for tests to work with. 
		this.slideItem = JsMockito.mock( app.views.palette.controls.carousel.CarouselItem.extend( { constructor: function(){} } ) );  // Need to overwrite constructor so we don't need required configs
		
		// Hook up the slideItemSelector to return a SlideItem, and the slideItem to return the Slide model
		JsMockito.when( this.slidesItemSelector ).getSelected().thenReturn( this.slideItem );
		JsMockito.when( this.slideItem ).getModel().thenReturn( this.slideModel );
	},
	
	
	/**
	 * Creates the appropriate model for the AbstractSlideshow tests.
	 * 
	 * @protected
	 * @method createModel
	 * @return {app.models.AbstractSlideshow}
	 */
	createModel : function() {
		var AbstractSlideshow = app.models.AbstractSlideshow.extend( {
			getFonts : function() { return [ 'font1', 'font2' ]; }
		} );
		
		return JsMockito.mock( AbstractSlideshow );
	}
	
} );



tests.unit.app.controllers.quark.edit.add( new Ext.test.Suite( {
	
	name: 'AbstractSlideshow',
	
	
	items : [
	
		/*
		 * Test onSlideSelect()
		 */
		new app.controllers.quark.edit.AbstractSlideshowTest( {
			name : "Test onSlideSelect()",
			
			
			"onSlideSelect() should update the model's 'activeItemId' attribute, when it has an empty string for the ID" : function() {
				var slideId = "";
				JsMockito.when( this.slideModel ).getId().thenReturn( slideId );
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onSlideSelect( this.slidesItemSelector, this.slideItem );
				
				try {
					JsMockito.verify( this.model ).set( 'activeItemId', slideId );
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			},
			
			
			"onSlideSelect() should update the model's 'activeItemId' attribute, when it has an actual ID" : function() {
				var slideId = 1;
				JsMockito.when( this.slideModel ).getId().thenReturn( slideId );
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onSlideSelect( this.slidesItemSelector, this.slideItem );
				
				try {
					JsMockito.verify( this.model ).set( 'activeItemId', slideId );
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			},
			
			
			// ------------------------------------
			
			
			// Test switching between the "title" slide's "edit panel" and the "general" slides' "edit panel" 
			
			"onSlideSelect() should switch the 'slideEditPanelContainer' card to the 'titleSlideEditPanel' when the 'title' slide is selected" : function() {
				var slideId = "";  // the id of the special "title" slide (i.e. an empty string; not an actual id of a "general" slide)
				JsMockito.when( this.slideModel ).getId().thenReturn( slideId );
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onSlideSelect( this.slidesItemSelector, this.slideItem );
				
				try {
					JsMockito.verify( this.slideEditPanelContainerLayout ).setActiveItem( this.titleSlideEditPanel );
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			},
			
			
			"onSlideSelect() should switch the 'slideEditPanelContainer' card to the 'generalSlideEditPanel' when a 'general' slide is selected" : function() {
				var slideId = 1;  // the id of a "general" slide (i.e. not the empty string id of the "title" slide)
				JsMockito.when( this.slideModel ).getId().thenReturn( slideId );
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onSlideSelect( this.slidesItemSelector, this.slideItem );
				
				try {
					JsMockito.verify( this.slideEditPanelContainerLayout ).setActiveItem( this.generalSlideEditPanel );
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			},
			
			
			// ------------------------------------
			
			// Test updating the "general" slides' "edit panel" controls
			
			
			"onSlideSelect() should update the controls in the 'generalSlideEditPanel' to the newly selected slide model's attributes, when a 'general' slide is selected" : function() {
				var slideId = 1,  // the id of a "general" slide (i.e. not the empty string id of the "title" slide)
				    picture = JsMockito.mock( app.models.PictureWithOptions ),
				    slideTitleFieldValue = "testTitleFieldValue",
				    slideDescriptionFieldValue = "testDescriptionFieldValue",
				    pictureSize = 'fill',
				    layout = 'left';
				
				JsMockito.when( this.slideModel ).getId().thenReturn( slideId );
				JsMockito.when( this.slideModel ).get( 'picture' ).thenReturn( picture );
				JsMockito.when( this.slideModel ).get( 'title' ).thenReturn( slideTitleFieldValue );
				JsMockito.when( this.slideModel ).get( 'description' ).thenReturn( slideDescriptionFieldValue );
				JsMockito.when( this.slideModel ).get( 'picture_size' ).thenReturn( pictureSize );
				JsMockito.when( this.slideModel ).get( 'layout' ).thenReturn( layout );
				
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onSlideSelect( this.slidesItemSelector, this.slideItem );
				
				try {
					JsMockito.verify( this.pictureSelector ).setPicture( picture );
					JsMockito.verify( this.slideTitleField ).setValue( slideTitleFieldValue );
					JsMockito.verify( this.slideDescriptionField ).setValue( slideDescriptionFieldValue );
					JsMockito.verify( this.pictureSizeSelector ).select( pictureSize );
					JsMockito.verify( this.layoutSelector ).select( layout );
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			}
		} ),
		
		
		/*
		 * Test onAddSlideClick()
		 */
		new app.controllers.quark.edit.AbstractSlideshowTest( {
			name : "Test onAddSlideClick()",
			
			setUp : function() {
				app.controllers.quark.edit.AbstractSlideshowTest.prototype.setUp.apply( this, arguments );
				
				// Make a new subclass of this.AbstractSlideshow with actual implementations of createSlideModel() and createSlideSelectorItem()
				this.AbstractSlideshow = this.AbstractSlideshow.extend( {
					createSlideModel : function() {
						return this.slideModel;
					}.createDelegate( this ),
					
					createSlideSelectorItem : function() {
						return this.slideItem;
					}.createDelegate( this )
				} );
			},
			
			
			"onAddSlideClick() should add a new Slide model to the collection, select it in the slidesItemSelector, and scroll to the new item" : function() {
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onAddSlideClick();
				
				try {
					JsMockito.verify( this.slidesCollection ).add( this.slideModel );
					JsMockito.verify( this.slidesItemSelector ).add( this.slideItem );
					JsMockito.verify( this.slidesItemSelector ).select( this.slideItem );
					JsMockito.verify( this.slidesItemSelector ).scrollToItem( this.slideItem );
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			}
		} ),
		
		
		/*
		 * Test onRemoveSlideClick()
		 */
		new app.controllers.quark.edit.AbstractSlideshowTest( {
			name : "Test onRemoveSlideClick()",
			
			
			"onRemoveSlideClick() should remove the slide's Slide model from the collection" : function() {				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onRemoveSlideClick( this.slideItem );
				
				try {
					JsMockito.verify( this.slidesCollection ).remove( this.slideModel );
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			},
			
			
			"onRemoveSlideClick() should select the 'next' item when a slide other than the last slide is removed" : function() {
				JsMockito.when( this.slidesItemSelector ).getItemIndex( this.slideItem ).thenReturn( 1 );  // the 1st of the 2 slides
				JsMockito.when( this.slidesItemSelector ).getCount().thenReturn( 2 );
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onRemoveSlideClick( this.slideItem );
				
				try {
					JsMockito.verify( this.slidesItemSelector, JsMockito.Verifiers.times( 2 ) ).selectItemAt( 0 );  // should select the first (in this case, the only remaining) item. Note: 1 call comes from the AbstractSlideshow constructor
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			},
			
			
			"onRemoveSlideClick() should select the 'previous' item when the last slide in the collection is removed" : function() {
				JsMockito.when( this.slidesItemSelector ).getItemIndex( this.slideItem ).thenReturn( 1 );  // the 2nd of the 2 slides
				JsMockito.when( this.slidesItemSelector ).getCount().thenReturn( 2 );
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onRemoveSlideClick( this.slideItem );
				
				try {
					JsMockito.verify( this.slidesItemSelector, JsMockito.Verifiers.times( 2 ) ).selectItemAt( 0 );  // should select the first (in this case, the only remaining) item. Note: 1 call comes from the AbstractSlideshow constructor
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			}
		} ),
		
		
		
		/*
		 * Test onSlideReorder()
		 */
		new app.controllers.quark.edit.AbstractSlideshowTest( {
			name : "Test onSlideReorder()",
			
			setUp : function() {
				app.controllers.quark.edit.AbstractSlideshowTest.prototype.setUp.apply( this, arguments );
				
				this.slideModel0 = JsMockito.mock( app.models.Slide );
				this.slideModel1 = JsMockito.mock( app.models.Slide );
				this.slideModel2 = JsMockito.mock( app.models.Slide );
				
				JsMockito.when( this.slidesCollection ).has( this.slideModel0 ).thenReturn( true );
				JsMockito.when( this.slidesCollection ).has( this.slideModel1 ).thenReturn( true );
				JsMockito.when( this.slidesCollection ).has( this.slideModel2 ).thenReturn( true );
				
				var ModelItem = app.components.controls.itemSelector.ModelItem.extend( { constructor: function(){} } );
				this.slideItem0 = JsMockito.mock( ModelItem );
				this.slideItem1 = JsMockito.mock( ModelItem );
				this.slideItem2 = JsMockito.mock( ModelItem );
				
				JsMockito.when( this.slideItem0 ).getModel().thenReturn( this.slideModel0 );
				JsMockito.when( this.slideItem1 ).getModel().thenReturn( this.slideModel1 );
				JsMockito.when( this.slideItem2 ).getModel().thenReturn( this.slideModel2 );
			},
			
	
			"onSlideReorder() should reorder the Slide's model in the collection (when reordered in the ItemSelector by the user)" : function() {
				JsMockito.when( this.slidesItemSelector ).getItems().thenReturn( [ this.slideItem0, this.slideItem1, this.slideItem2 ] );
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onSlideReorder( this.slidesItemSelector, this.slideItem2, 1, 2 );  // moving from index 2 to 1 
								
				try {
					JsMockito.verify( this.slidesCollection ).insert( this.slideModel2, 1 );
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
				
				abstractSlideshow.destroy();  // clean up
			},
			
			
			"onSlideReorder() should properly reorder the Slide's model in the collection when there are extra (non-collection) ModelItem in the ItemSelector" : function() {
				var extraItem1 = new app.components.controls.itemSelector.ModelItem( {
					model : JsMockito.mock( Kevlar.Model ),
					tpl : function() {}
				} );
				var extraItem2 = new app.components.controls.itemSelector.Item( {   // a non-ModelItem, just to make sure that these are handled
					tpl : function() {}
				} );
				var extraItem3 = new app.components.controls.itemSelector.ModelItem( {
					model : JsMockito.mock( Kevlar.Model ),
					tpl : function() {}
				} );
				
				
				// Add the "extraItems" in with the model items, so that it would mess up the normal offset into the collection for a moved ModelItem
				JsMockito.when( this.slidesItemSelector ).getItems().thenReturn( [ extraItem1, extraItem2, this.slideItem0, this.slideItem1, this.slideItem2, extraItem3 ] );
				
				// We're going to pretend we've moved the last of the collection's model components (the 5th component) to be the 4th component.
				// This *should* move it to index 1 (position 2) in the collection though, as there are 2 "extra" components before it
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onSlideReorder( this.slidesItemSelector, this.slideItem2, 3, 4 );  // moving from index 4 to 3
				
				try {
					JsMockito.verify( this.slidesCollection ).insert( this.slideModel2, 1 );  // Should still be inserted into the Collection at index 1, to account for the "extra items"
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
				
				abstractSlideshow.destroy();  // clean up
			}
			
		} ),
		
		
	
		/*
		 * Test onPictureChange()
		 */
		new app.controllers.quark.edit.AbstractSlideshowTest( {
			name : "Test onPictureChange()",
			
			setUp : function() {
				app.controllers.quark.edit.AbstractSlideshowTest.prototype.setUp.apply( this, arguments );
				
				
				var picture = JsMockito.mock( app.models.PictureWithOptions );
				JsMockito.when( this.slideModel ).get( 'picture' ).thenReturn( picture );
			},
			
			
			"onPictureChange() should update the slide model's 'picture' attribute with the new picture" : function() {
				var picture = JsMockito.mock( app.models.PictureWithOptions );
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onPictureChange( this.pictureSelector, picture );
				
				try {
					JsMockito.verify( this.slideModel ).set( 'picture', picture );
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			}
		} ),
		
		
		/*
		 * Test onTitleChange()
		 */
		new app.controllers.quark.edit.AbstractSlideshowTest( {
			name : "Test onTitleChange()",
			
			
			"onTitleChange() should update the slide model's 'title' attribute with the new value of the slideTitleField" : function() {
				var slideTitleFieldValue = "testValue";
				JsMockito.when( this.slideTitleField ).getValue().thenReturn( slideTitleFieldValue );
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onTitleChange( this.slideTitleField, /* no evt arg needed */ null );
				
				try {
					JsMockito.verify( this.slideModel ).set( 'title', slideTitleFieldValue );
					JsMockito.verifyNoMoreInteractions( this.slideModel );
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			}
		} ),
		
		
		/*
		 * Test onDescriptionChange()
		 */
		new app.controllers.quark.edit.AbstractSlideshowTest( {
			name : "Test onDescriptionChange()",
			
			
			"onDescriptionChange() should update the slide model's 'description' attribute with the new value of the slideDescriptionField" : function() {
				var slideDescriptionFieldValue = "testValue";
				JsMockito.when( this.slideDescriptionField ).getValue().thenReturn( slideDescriptionFieldValue );
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onDescriptionChange( this.slideDescriptionField, /* no evt arg needed */ null );
				
				try {
					JsMockito.verify( this.slideModel ).set( 'description', slideDescriptionFieldValue );
					JsMockito.verifyNoMoreInteractions( this.slideModel );
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			}
		} ),
		
		
		/*
		 * Test onPictureSizeChange()
		 */
		new app.controllers.quark.edit.AbstractSlideshowTest( {
			name : "Test onPictureSizeChange()",
			
			
			"onPictureSizeChange() should update the slide model's 'picture_size' attribute with the newly selected item's value" : function() {
				var pictureSizeValue = 'fill';
				var item = JsMockito.mock( app.components.controls.itemSelector.Item );
				JsMockito.when( item ).getValue().thenReturn( pictureSizeValue );
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onPictureSizeChange( this.pictureSizeSelector, item );
				
				try {
					JsMockito.verify( this.slideModel ).set( 'picture_size', pictureSizeValue );
					JsMockito.verifyNoMoreInteractions( this.slideModel );
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			}
		} ),
		
		
		/*
		 * Test onLayoutChange()
		 */
		new app.controllers.quark.edit.AbstractSlideshowTest( {
			name : "Test onLayoutChange()",
			
			
			"onLayoutChange() should update the slide model's 'layout' attribute with the newly selected item's value" : function() {
				var layoutValue = 'left';
				var item = JsMockito.mock( app.components.controls.itemSelector.Item );
				JsMockito.when( item ).getValue().thenReturn( layoutValue );
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onLayoutChange( this.layoutSelector, item );
				
				try {
					JsMockito.verify( this.slideModel ).set( 'layout', layoutValue );
					JsMockito.verifyNoMoreInteractions( this.slideModel );
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			}
		} ),
		
		
		/*
		 * Test onActiveItemIdChange()
		 */
		new app.controllers.quark.edit.AbstractSlideshowTest( {
			name : "Test onActiveItemIdChange()",
			
			
			"onActiveItemIdChange() should have the slidesItemSelector select the first slide (the 'title' slide) if provided the empty string for the activeItemId" : function() {
				var activeItemId = "";  // for the "title" slide
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onActiveItemIdChange( this.model, activeItemId );
				
				try {
					JsMockito.verify( this.slidesItemSelector, JsMockito.Verifiers.times( 2 ) ).selectItemAt( 0 );  // should select the first slide (the "title" slide). One invocation comes from the AbstractSlideshow constructor
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			},
			
			
			"onActiveItemIdChange() should have the slidesItemSelector select the slide based on the provided activeItemId" : function() {
				var activeItemId = 1;
				
				// a non-ModelItem, just to make sure that these are handled
				var extraItem = JsMockito.mock( app.components.controls.itemSelector.Item.extend( { constructor: function(){} } ) );
				
				JsMockito.when( this.slideModel ).getId().thenReturn( activeItemId );
				JsMockito.when( this.slidesItemSelector ).getItems().thenReturn( [ extraItem, this.slideItem ] );
				
				var abstractSlideshow = new this.AbstractSlideshow( this.createControllerConfig() );
				abstractSlideshow.onActiveItemIdChange( this.model, activeItemId );
				
				try {
					JsMockito.verify( this.slidesItemSelector ).select( this.slideItem );
				} catch( msg ) {
					Y.Assert.fail( msg );
				}
			}
		} )
	]
	
} ) );
/**
 * class Glider
 *
 * The main Glider class
 **/
var Glider = Class.create({

  /**
   * Glider.new(container[, options = {}]) -> Glider
   * - container (Element): the container that holds the glidable setions
   * - options (Hash): options for the glider ({ direction: ('x'|'y'), transition: Effect.Transitions, duration: Float, onGlide: Function })
   *
   * Initializes a new Glider
   **/
  initialize: function(container, options) {
    this.container = $(container);
    this.options = $H({ direction: 'x', transition: Effect.Transitions.sinoidal, duration: .6 }).merge(options);
    this.sectionsContainer = this.container.down('.sections');
    this.sectionInfo = this.collectSectionInfo();
    this.container.setStyle({
      height: this.sectionInfo.first().section.getHeight() + 'px',
      width: this.sectionInfo.first().section.getWidth() + 'px'
    });
    this.setInitialSection();
  },

  // private method -> no documentation
  collectSectionInfo: function() {
    counter = -1;
    sections = this.sectionsContainer.select('.section');
    return sections.map(function(section) {
      counter++;
      return {
        section: $(section),
        index: counter,
        left: function() {
          value = 0;
          for (i = 0; i < counter; i++) {
            value += sections[i].getWidth();
          }
          return value;
        }(),
        top: function() {
          value = 0;
          for (i = 0; i < counter; i++) {
            value += sections[i].getHeight();
          }
          return value;
        }()
      }
    });
  },

  // private method -> no documentation
  setInitialSection: function() {
    initial = null;
    if (document.location.href.indexOf('#') > 0) {
      initial = this.sectionInfo.find(function(sectionInfo) {
        return sectionInfo.section.id == document.location.href.split('#').last();
      });
      initial = initial ? initial.section : null;
    }
    if (!initial && (initialSection = this.sectionsContainer.select('.initial')).length == 1) {
      initial = initialSection[0];
    }
    if (!initial) {
      initial = this.sectionInfo.first().section;
    }
    this.showSection(initial.id, 0.0000000000001);
  },

  // private method -> no documentation
  getSectionInfo: function(id) {
    return this.sectionInfo.find(function(sectionInfo) {
      return sectionInfo.section.id == id;
    });
  },

  // private method -> no documentation
  calculateEffects: function(sectionInfo, duration) {
    effects = [];
    movements = { x: 0, y: 0 }
    scales =    { x: false, y: false, factor: 1}
    if (this.options.get('direction') == 'x') {
      direction = (this.sectionsContainer.positionedOffset().left + sectionInfo.left) > 0 ? -1 : 1;
      movements.x   = (Math.abs(this.sectionsContainer.positionedOffset().left + sectionInfo.left) * direction)
      scales.factor = sectionInfo.section.getWidth() / this.container.getWidth();
      scales.x      = true;
    } else {
      direction = (this.sectionsContainer.positionedOffset().top + sectionInfo.top) > 0 ? -1 : 1;
      movements.y   = (Math.abs(this.sectionsContainer.positionedOffset().top + sectionInfo.top) * direction)
      scales.factor = sectionInfo.section.getHeight() / this.container.getHeight();
      scales.y      = true;
    }
    effects.push(new Effect.Move(this.sectionsContainer, {
      duration: duration,
      x: movements.x,
      y: movements.y,
      transition: this.options.get('transition'),
      queue: { scope: 'simplabs:glider' }
    }));
    if (scales.factor != 1) {
      effects.push(new Effect.Scale(this.container, scales.factor * 100, {
        duration: duration,
        scaleX: scales.x,
        scaleY: scales.y,
        scaleContent: false,
        queue: { scope: 'simplabs:glider' }
      }));
    }
    return effects;
  },

  /**
   * Glider#showSection(sectionId[, duration]) -> null
   * - sectionId (String): the element id of the section to show
   * - duration (Float): the duration for the slide effect(s)
   *
   * Show a section by gliding the sections into the according direction until the section to show is reached.
   **/
  showSection: function(sectionId, duration) {
    duration = duration || this.options.get('duration');
    Effect.Queues.get('simplabs:glider').each(function(effect) { effect.cancel(); });
    sectionInfo = this.getSectionInfo(sectionId);
    if (sectionInfo == undefined) {
      return;
    }
    effects = this.calculateEffects(sectionInfo, duration);
    new Effect.Parallel(effects, {
      duration: duration,
      queue: { scope: 'simplabs:glider' },
      afterFinish: function() {
        this.currentSection = sectionInfo;
        if (this.options.get('onGlide')) {
          this.options.get('onGlide')(this.currentSection.section);
        }
      }.bind(this)
    });
  },

  /**
   * Glider#atFirstSection() -> null
   *
   * Gets whether the Glider is currently positioned at the first section (Glider#previousSection() of course won't work then)
   **/
  atFirstSection: function() {
    return this.currentSection && this.currentSection.index == 0;
  },

  /**
   * Glider#atLastSection() -> null
   *
   * Gets whether the Glider is currently positioned at the last section (Glider#nextSection() of course won't work then)
   **/
  atLastSection: function() {
    return this.currentSection && this.currentSection.index == (this.sectionInfo.length - 1);
  },

  /**
   * Glider#showNextSection() -> null
   *
   * Glides to the next section (the section after the one that is currently displayed); won't do anything if the 
    * Glider is currently positioned at the last section (see Glider#atLastSection())
   **/
  showNextSection: function() {
    if (this.atLastSection()) return;
    this.showSection(this.sectionInfo[this.currentSection.index + 1].section.id);
  },

  /**
   * Glider#showPreviousSection() -> null
   *
   * Glides to the previous section (the section before the one that is currently displayed); won't do anything if the 
   * Glider is currently positioned at the first section (see Glider#atFirstSection())
   **/
  showPreviousSection: function() {
    if (this.atFirstSection()) return;
    this.showSection(this.sectionInfo[this.currentSection.index - 1].section.id);
  }

});

/**
 * class GliderLink
 *
 * GliderLinks are special links that toggle the glider to glide to specific sections.
 **/
var GliderLink = Class.create({

  /**
   * GliderLink.new(link, glider) -> GliderLink
   * - link (Element): the link element; must be an <a> tag with the href attrbute set to '#sectionId' (including the '#')
   * - glider (Glider): the glider to show the section in
   *
   * Initializes a new GliderLink
   **/
  initialize: function(link, glider) {
    this.link = $(link);
    this.glider = glider;
    this.link.observe('click', this.onclick.bindAsEventListener(this));
  },

  // private method -> no documentation
  onclick: function(event) {
    Event.stop(event);
    this.glider.showSection(this.link.href.split('#').last());
  }

});

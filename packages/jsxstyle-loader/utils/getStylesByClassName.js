'use strict';

const invariant = require('invariant');

const getClassNameFromCache = require('./getClassNameFromCache');

const nonStyleProps = {
  children: true,
  className: true,
  component: true,
  props: true,
  style: true,
  mediaQueries: true,
};

function getStylesByClassName(
  styleGroups,
  namedStyleGroups,
  staticAttributes,
  cacheObject
) {
  if (typeof staticAttributes !== 'undefined') {
    invariant(
      typeof staticAttributes === 'object' && staticAttributes !== null,
      'getStylesByClassName expects an object as its second parameter'
    );
  }

  invariant(
    typeof cacheObject === 'object' && cacheObject !== null,
    'getStylesByClassName expects an object as its third parameter'
  );

  let hasItems = false;
  const styleProps = {};
  for (const item in staticAttributes) {
    if (
      nonStyleProps.hasOwnProperty(item) ||
      !staticAttributes.hasOwnProperty(item)
    ) {
      continue;
    }
    hasItems = true;
    styleProps[item] = staticAttributes[item];
  }

  if (!hasItems) {
    return {};
  }

  const stylesByClassName = {};

  // Feature: Style groups! if you want a bit more control over how classNames are generated,
  //   you can specify an object of style objects keyed by the className that should represent that group of styles.
  //   if all style props in the group are present on the element, they'll be extracated and
  //   the corresponding className will be added to the element.
  if (namedStyleGroups) {
    // class name key --> object of style props
    // apparently you can label for loops?! i've been writing javascript for over a decade and i just discovered this.
    objLoop: for (const classNameKey in namedStyleGroups) {
      const styleObject = namedStyleGroups[classNameKey];
      // prop --> value
      for (const prop in styleObject) {
        const value = styleObject[prop];
        if (styleProps[prop] !== value) {
          // skip to the next style object
          continue objLoop;
        }
      }
      // if we're made it this far, all the style props in styleObject are present in styleProps.
      // delete props from styleObject and add them to a new style object with the provided key.
      stylesByClassName[classNameKey] = {};
      for (const prop in styleObject) {
        // since we're already looping through styleObject, clone the object here instead of using object.assign
        stylesByClassName[classNameKey][prop] = styleObject[prop];
        delete styleProps[prop];
      }
      if (staticAttributes.mediaQueries) {
        stylesByClassName[classNameKey].mediaQueries =
          staticAttributes.mediaQueries;
      }
    }
  }

  if (styleGroups) {
    arrayLoop: for (let idx = -1, len = styleGroups.length; ++idx < len; ) {
      const styleObject = styleGroups[idx];
      for (const prop in styleObject) {
        const value = styleObject[prop];
        if (!styleProps.hasOwnProperty(prop) || styleProps[prop] !== value) {
          // skip to the next style object
          continue arrayLoop;
        }
      }

      const className = getClassNameFromCache(styleObject, cacheObject);
      if (!className) {
        continue arrayLoop;
      }

      // if we're made it this far, all the style props in styleObject are present in styleProps.
      // delete props from styleObject and add them to a new style object with the provided key.
      stylesByClassName[className] = {};
      for (const prop in styleObject) {
        // since we're already looping through styleObject, clone the object here instead of using object.assign
        stylesByClassName[className][prop] = styleObject[prop];
        delete styleProps[prop];
      }
      if (staticAttributes.mediaQueries) {
        stylesByClassName[className].mediaQueries =
          staticAttributes.mediaQueries;
      }
    }
  }

  if (Object.keys(styleProps).length > 0) {
    const className = getClassNameFromCache(styleProps, cacheObject);
    if (className) {
      stylesByClassName[className] = styleProps;
      if (staticAttributes.mediaQueries) {
        stylesByClassName[className].mediaQueries =
          staticAttributes.mediaQueries;
      }
    }
  }

  return stylesByClassName;
}

module.exports = getStylesByClassName;
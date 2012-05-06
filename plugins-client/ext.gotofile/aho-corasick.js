define(function(require, module, exports) {
// Aho-Corasick String Search Algorithm
// @author Jalada http://jalada.co.uk
// Arguments:
//   trie - a Trie as per http://is.gd/1Y9FT
//   s - string to be searched
function ahoCorasick(trie, s) {
    // Start at the root.
    var current = trie;
    // Nothing in state at the moment
    var state = "";
    // Split the string
    var split = s.split("");
    var j = 0, i;    
    // We return everywhere in this loop.
    while (1) {
        for (i=j; i<split.length; i++) {
            var r = current.hasChild(split[i]);
            // Does this character exist in the children of where we
            //are in the trie?
            if (r) {
                // If so, append to the state, and traverse to
                // that child
                state += split[i];
                //current = r;
                // Have we found a word now?
                if (trie.getWordCount(state) != 0) {
                    return true;
                }
            } else {
                // If not, go back to where we started to match,
                //reduce i, and empty the state
                current = trie;
                i = i - state.length;
                state = "";
            }
        }
        // Reached the end of the string
        if (state == "") {
            // Just found nothing
            return false;
        } else {
            // Was in the middle of finding something, so possibly
            //missed something, so go back to check.
            current = trie;
            j = i - state.length + 1;
            state = "";
        }
    }
}
module.exports = {
    ahoCorasick: ahoCorasick
};
});
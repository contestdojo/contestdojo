import _MathJax from "react-mathjax-preview";

const MathJax = ({ math }) => {
  return (
    <_MathJax
      script="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML"
      math={math}
    />
  );
};

export default MathJax;

// import "../styles/home.css";

// function ProductCard({ product }) {
//   return (
//     <div className="product-card">
//       <img src={product.image} alt="product" />
//       <h3>{product.name}</h3>
//       <p>₹{product.price}</p>
//       <button>Add to Cart</button>
//     </div>
//   );
// }

// export default ProductCard;

import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import "../styles/home.css";

function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);

  return (
    <div className="product-card">
      <img src={product.image} alt="product" />
      <h3>{product.name}</h3>
      <p>₹{product.price}</p>

      <button onClick={() => addToCart(product)}>
        Add to Cart
      </button>
    </div>
  );
}
export default ProductCard;
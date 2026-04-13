import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import products from "../data/products";
import "../styles/home.css";

function Home() {
  return (
    <>
      <Navbar />

      <div className="home-container">
        <h2>Products</h2>

        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </>
  );
}

export default Home;

//Props = data passed from one component to another

// Props = data passed from one component to another
//This is also a way to use props but we used the destructured way.

//function ProductCard({ product }) {
//If we would have written 
//            <ProductCard key={product.id} item={product} />
//then over here in the child
//function ProductCard({ item }) {



import Image from "next/image";
import GoToUserControl from "./leaflet/GoToUserControl";

/**
 * Site header
 */
export const Header = () => {
  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2 h-16">
      <div className="navbar-start w-auto lg:w-1/2 text-align-left">
        <Image
          className="aspect-square size-16 p-0 mr-5"
          src="/logo.svg"
          alt="10 tance donut logo"
          width={64}
          height={64}
        />
        <h1 className="inline-block align-middle m-0 font-medium h-full leading-[4rem] text-xl">10 Tance</h1>
      </div>
      <div className="navbar-center align-middle font-light h-full leading-[4rem] text-xl">
        <span>
          showing <em>ERC20</em> objects from the <em>Optimism</em> chain
        </span>
      </div>
      <GoToUserControl className="navabar-end w-auto lg:w-1/2 justify-end" />
    </div>
  );
};

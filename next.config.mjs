// Links cortos por producto: /go/<slug> y /success/<slug> redirigen al link con ?c=
// (los parámetros como fbclid o utm_* se conservan en la redirección)
const products = {
  27: {
    p: '1942441866476662',
    k: '',
    s: 'https://buy.stripe.com/8x27sDaowe1w8b8cYW2401f',
    n: '',
    v: '27',
    c: 'EUR',
    t: '¡Gracias por tu compra!',
    m: 'Tu pedido ha sido procesado correctamente. Revisa tu email para más detalles.',
  },
}

const encode = (config) => Buffer.from(JSON.stringify(config), 'utf8').toString('base64')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return Object.entries(products).flatMap(([slug, config]) => [
      { source: `/go/${slug}`, destination: `/go?c=${encode(config)}`, permanent: false },
      { source: `/success/${slug}`, destination: `/success?c=${encode(config)}`, permanent: false },
    ])
  },
}

export default nextConfig

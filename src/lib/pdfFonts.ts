import { Font } from '@react-pdf/renderer';

export const registerPDFFonts = () => {
    Font.register({
        family: 'Inter',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf' },
            { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.ttf', fontWeight: 700 },
        ],
    });

    Font.register({
        family: 'Montserrat',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459Wlhyw.ttf' },
            { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459Wdhyzbi.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm459WRhyzbi.ttf', fontWeight: 700 },
        ],
    });

    Font.register({
        family: 'Raleway',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/raleway/v28/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaorCIPrQ.ttf' },
            { src: 'https://fonts.gstatic.com/s/raleway/v28/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVsEpbCIPrQ.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/raleway/v28/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVtaoMCIPrQ.ttf', fontWeight: 700 },
        ],
    });

    Font.register({
        family: 'Poppins',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrFJA.ttf' },
            { src: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6V1s.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7V1s.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/poppins/v24/pxiGyp8kv8JHgFVrJJLedw.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/poppins/v24/pxiDyp8kv8JHgFVrJJLmr19lEA.ttf', fontWeight: 600, fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/poppins/v24/pxiDyp8kv8JHgFVrJJLmy15lEA.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });

    Font.register({
        family: 'Lato',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXg.ttf' },
            { src: 'https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UvsWiPGQ.ttf', fontWeight: 700 },
        ],
    });

    Font.register({
        family: 'Roboto',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf' },
            { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf', fontWeight: 700 },
        ],
    });

    Font.register({
        family: 'Open Sans',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVQUwaEQbjA.ttf' },
            { src: 'https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4gaVQUwaEQbjA.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsgH1x4gaVQUwaEQbjA.ttf', fontWeight: 700 },
        ],
    });

    Font.register({
        family: 'Playfair Display',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.ttf' },
            { src: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKebukDQ.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiukDQ.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtY.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_naUbtY.ttf', fontWeight: 600, fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_k-UbtY.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });

    Font.register({
        family: 'Lora',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787weuyJG.ttf' },
            { src: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787zAvCJG.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787z5vCJG.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/lora/v37/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFkqg.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/lora/v37/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-BQCkqg.ttf', fontWeight: 600, fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/lora/v37/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-C0Ckqg.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });

    Font.register({
        family: 'Merriweather',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDr3icqEw.ttf' },
            { src: 'https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDrOSAqEw.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/merriweather/v33/u-4B0qyriQwlOrhSvowK_l5-eTxCVx0ZbwLvKH2Gk9hLmp0v5yA-xXPqCzLvPee1XYk_XSf-FmTCUF3w.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/merriweather/v33/u-4B0qyriQwlOrhSvowK_l5-eTxCVx0ZbwLvKH2Gk9hLmp0v5yA-xXPqCzLvPee1XYk_XSf-FmQlV13w.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });

    Font.register({
        family: 'Raleway',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaooCP.ttf' },
            { src: 'https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVsEpYCP.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVs9pYCP.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/raleway/v37/1Pt_g8zYS_SKggPNyCgSQamb1W0lwk4S4WjMPrQ.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/raleway/v37/1Pt_g8zYS_SKggPNyCgSQamb1W0lwk4S4bbLPrQ.ttf', fontWeight: 600, fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/raleway/v37/1Pt_g8zYS_SKggPNyCgSQamb1W0lwk4S4Y_LPrQ.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });

    Font.register({
        family: 'Source Sans Pro',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/sourcesanspro/v23/6xK3dSBYKcSV-LCoeQqfX1RYOo3aPw.ttf' },
            { src: 'https://fonts.gstatic.com/s/sourcesanspro/v23/6xKydSBYKcSV-LCoeQqfX1RYOo3i54rAkA.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/sourcesanspro/v23/6xKydSBYKcSV-LCoeQqfX1RYOo3ig4vAkA.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/sourcesanspro/v23/6xK1dSBYKcSV-LCoeQqfX1RYOo3qPa7g.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/sourcesanspro/v23/6xKwdSBYKcSV-LCoeQqfX1RYOo3qPZY4lBdr.ttf', fontWeight: 600, fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/sourcesanspro/v23/6xKwdSBYKcSV-LCoeQqfX1RYOo3qPZZclRdr.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });
};

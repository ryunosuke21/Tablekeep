import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  render,
  Section,
  Tailwind,
  Text,
} from "react-email";

import { BarebonesFonts, barebonesBoxedTailwindConfig } from "../styles";
import type { AdditionalLinks } from "../types/additional";

type MagicLinkProps = {
  appName: string;
  url: string;
  baseUrl: string;
  additionalLinks?: AdditionalLinks;
};

export const MagicLink = ({
  appName,
  url,
  baseUrl,
  additionalLinks,
}: MagicLinkProps) => (
  <Tailwind config={barebonesBoxedTailwindConfig}>
    <Html>
      <Head>
        <style>
          {`
            :root {
              color-scheme: light dark;
              supported-color-schemes: light dark;
            }

            @media (prefers-color-scheme: dark) {
              .logo-light {
                display: none !important;
              }

              .logo-dark {
                display: block !important;
                max-height: none !important;
                overflow: visible !important;
              }
            }

            [data-ogsc] .logo-light {
              display: none !important;
            }

            [data-ogsc] .logo-dark {
              display: block !important;
              max-height: none !important;
              overflow: visible !important;
            }
          `}
        </style>
        <BarebonesFonts />
      </Head>

      <Body className="m-0 bg-bg-2 text-center font-sans">
        <Preview>Your sign-in link for {appName}</Preview>
        <Container className="mx-auto mobile:mt-0 mt-8 w-full max-w-[640px]">
          <Section>
            <Section className="bg-bg mobile:px-2 px-6 py-4">
              <Section className="mb-3 px-6">
                <Row>
                  <Column className="w-1/2 py-[7px] align-middle">
                    <Row>
                      <Column className="w-[32px] align-middle">
                        <Link href={baseUrl}>
                          <Img
                            src={`${baseUrl}/towerkeep.png`}
                            alt=""
                            width={23}
                            className="block"
                          />
                        </Link>
                      </Column>
                    </Row>
                  </Column>
                  <Column align="right" className="w-1/2 py-[7px] align-middle">
                    <Link
                      href={baseUrl}
                      className="m-0 text-right font-13 font-sans"
                    >
                      <span className="text-fg-3">{appName}</span>
                    </Link>
                  </Column>
                </Row>
              </Section>
              <Section className="rounded-[8px] bg-bg-2 mobile:px-6 px-[40px] mobile:py-12 py-[64px] text-center">
                <Section className="mb-3">
                  <Link href={baseUrl}>
                    <Img
                      src={`${baseUrl}/towerkeep-icon.svg`}
                      alt="Logo"
                      width={48}
                      className="logo-dark mx-auto mb-5 block"
                    />
                    <Img
                      src={`${baseUrl}/towerkeep-icon-light.svg`}
                      alt="Logo"
                      width={48}
                      className="logo-light mx-auto mb-5 block"
                    />
                  </Link>
                  <Heading as="h1" className="m-0 font-28 font-sans text-fg">
                    Sign in to {appName}
                  </Heading>
                </Section>

                <Text className="mx-auto mt-0 mb-8 max-w-[380px] text-center font-16 font-sans text-fg-2">
                  Use the button below to sign in to your account.
                  <br />
                  This link expires soon and can only be used once.
                </Text>

                <Section className="mb-6 text-center">
                  <Button
                    href={url}
                    className="inline-block rounded-lg bg-fg px-7 py-4 text-center font-16 font-sans text-fg-inverted leading-6"
                  >
                    Sign in
                  </Button>
                </Section>

                <Text className="mx-auto mt-8 mb-0 max-w-[400px] text-center font-13 font-sans text-fg-3">
                  If you didn&apos;t request this,
                  <br />
                  please ignore this email.
                </Text>
              </Section>

              {/* Footer */}
              <Section className="bg-bg">
                <Row>
                  <Column className="px-6 py-10 text-center">
                    <Text className="mx-auto mt-0 mb-8 max-w-[280px] text-center font-13 font-sans text-fg-3">
                      Less bookkeeping at the table — more time to play.
                    </Text>

                    <Text className="mt-4 mb-5 text-center font-11 font-sans text-fg-3">
                      You received this email because a sign-in link was
                      requested for this address.
                    </Text>
                    <Text className="m-0 text-center font-11 font-sans text-fg-3">
                      <Link
                        href={additionalLinks?.privacyPolicy || baseUrl}
                        className="text-fg-3"
                      >
                        Privacy policy
                      </Link>
                    </Text>
                  </Column>
                </Row>
              </Section>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

export const renderMagicLink = (props: MagicLinkProps) =>
  render(<MagicLink {...props} />);

MagicLink.PreviewProps = {
  appName: "Tablekeep",
  url: "http://localhost:3000/magic-link",
  baseUrl: "http://localhost:3000",
} satisfies MagicLinkProps;

export default MagicLink;

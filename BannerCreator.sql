--
-- PostgreSQL database dump
--

\restrict 1tuUcYpeqooIHPpfwABYc8mitjeqfTEvWmDit5Jg0WjdAUEDfc9l2bShFCyPlcr

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-14 14:48:04

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 16556)
-- Name: account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account (
    id text DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp without time zone,
    refresh_token_expires_at timestamp without time zone,
    scope text,
    password text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.account OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16611)
-- Name: admin_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_reports (
    id text DEFAULT gen_random_uuid() NOT NULL,
    target_user_id text NOT NULL,
    reporter_user_id text NOT NULL,
    target_name text,
    target_email text,
    target_role text,
    reporter_name text,
    reporter_email text,
    description text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_reports OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16507)
-- Name: recovery_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recovery_codes (
    id integer NOT NULL,
    email text NOT NULL,
    code text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false
);


ALTER TABLE public.recovery_codes OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16506)
-- Name: recovery_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recovery_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recovery_codes_id_seq OWNER TO postgres;

--
-- TOC entry 5086 (class 0 OID 0)
-- Dependencies: 219
-- Name: recovery_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recovery_codes_id_seq OWNED BY public.recovery_codes.id;


--
-- TOC entry 222 (class 1259 OID 16535)
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    id text DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    ip_address text,
    user_agent text
);


ALTER TABLE public.session OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16589)
-- Name: tamplates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tamplates (
    id text DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    desciption text,
    page_type text NOT NULL,
    template_data jsonb NOT NULL,
    thumbnail text,
    is_public boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tamplates OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16520)
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    id text DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    email_verified boolean DEFAULT false,
    image text,
    password text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    role text DEFAULT 'user'::text NOT NULL,
    usertype text DEFAULT 'user'::text NOT NULL,
    name text DEFAULT ''::text NOT NULL
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16575)
-- Name: verification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification (
    id text DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.verification OWNER TO postgres;

--
-- TOC entry 4880 (class 2604 OID 16510)
-- Name: recovery_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recovery_codes ALTER COLUMN id SET DEFAULT nextval('public.recovery_codes_id_seq'::regclass);


--
-- TOC entry 5077 (class 0 OID 16556)
-- Dependencies: 223
-- Data for Name: account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account (id, user_id, account_id, provider_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at) FROM stdin;
tp08X0cRRgiGbyV9HOYYKq6gG5EQXbvJ	qa3bIsRop6Yg82IxmBaLBK3RibFAJt3w	qa3bIsRop6Yg82IxmBaLBK3RibFAJt3w	credential	\N	\N	\N	\N	\N	\N	76bd491e505f64f0325f70a866b5252b:0b00630ad5510a4e9d664707506731cdfeb8f89e54f6b1480046dd8bc4d2be12e1b09197d840a378ea0f517fa5370408f485afd6459d61c709a540a1ddce547a	2026-04-13 15:55:22.081	2026-04-13 15:55:22.081
mOW2msixQYAK26anZrJFYwoAWzdtQQJ5	aZhrTtukaR7ik16kLG6CQtaHXA18UZc7	aZhrTtukaR7ik16kLG6CQtaHXA18UZc7	credential	\N	\N	\N	\N	\N	\N	e2e56222d15e7035a8156dbc65f9a74e:21789b432baff687527c816758e6926c9f3b3516808c7c81b480e2dee0407b6a5afc7ddc237d6e40a0444d7798c389828145a92da4203fcc52590fb288a2a34c	2026-04-13 16:24:00.278	2026-04-13 16:24:00.278
YNL8KqyVsXF91rri1QDb3Xy1v7T7YPob	ON49xEseqKi5XJi5FvdSpnDrVdN7kuzT	ON49xEseqKi5XJi5FvdSpnDrVdN7kuzT	credential	\N	\N	\N	\N	\N	\N	aece219b4b5512d2e62a4b8abbae4ec3:8f44750a600739e85fc7d63fe6b49be6c997c8cc2b8269ab3b4bbea7a154dac209eba0491d9fae73518473398952821d73164bc43a5bbbad27faca277ad33cbe	2026-04-13 16:29:53.258	2026-04-13 16:29:53.258
V8A4pqnAaYdOKGM03dez9CuKX41xcnAR	60v6F3ya4TJe0TnHaZJfTXwh0uwLks02	60v6F3ya4TJe0TnHaZJfTXwh0uwLks02	credential	\N	\N	\N	\N	\N	\N	ce7784c51b96671c96f4d34a7b388912:961bbd0321fdc0092bc2fbee5a0e3b34faa60751ebd73a3efd41a917805466c39c16e1103cd0bfd690ce4e73623826914588e8180721f9863829154220bc16f5	2026-04-14 10:46:45.586	2026-04-14 10:47:37.431393
\.


--
-- TOC entry 5080 (class 0 OID 16611)
-- Dependencies: 226
-- Data for Name: admin_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_reports (id, target_user_id, reporter_user_id, target_name, target_email, target_role, reporter_name, reporter_email, description, created_at) FROM stdin;
1270d2c0-daeb-4e40-8c99-033ead0210f6	aZhrTtukaR7ik16kLG6CQtaHXA18UZc7	60v6F3ya4TJe0TnHaZJfTXwh0uwLks02	David Nascimento	nascimentoxdavid@gmail.com	admin	Pedro	pedro@gmail.com	O David ja foi dimitido a 1 mes, ainda esta aqui o ser user	2026-04-14 10:53:17.904985
\.


--
-- TOC entry 5074 (class 0 OID 16507)
-- Dependencies: 220
-- Data for Name: recovery_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recovery_codes (id, email, code, expires_at, used) FROM stdin;
1	nascimentoxdavid@gmail.com	641604	2026-04-13 15:58:36.174217	f
2	nascimentoxdavid@gmail.com	683417	2026-04-13 15:58:53.905614	f
3	nascimentoxdavid@gmail.com	341732	2026-04-13 15:59:55.926181	f
4	nascimentoxdavid@gmail.com	804409	2026-04-13 16:08:44.454044	f
5	nascimentoxdavid@gmail.com	666013	2026-04-13 16:09:56.717514	t
6	pedro@gmail.com	629524	2026-04-14 11:47:18.583474	t
\.


--
-- TOC entry 5076 (class 0 OID 16535)
-- Dependencies: 222
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session (id, user_id, token, expires_at, created_at, updated_at, ip_address, user_agent) FROM stdin;
B4S11N09AH8tZZ0cxmpLVZSllxnhHSUt	qa3bIsRop6Yg82IxmBaLBK3RibFAJt3w	3A3o5N8jnEmgf4YFmFiBsmBr8sF4xSar	2026-04-20 15:55:22.097	2026-04-13 15:55:22.097	2026-04-13 15:55:22.097		
iY8WFoNzzOrkszKFMTC0XczrsBHHa2jt	aZhrTtukaR7ik16kLG6CQtaHXA18UZc7	SSGr8ADZYAUkBLiECDbbbt6NPjWb56Zs	2026-04-20 16:24:00.29	2026-04-13 16:24:00.29	2026-04-13 16:24:00.29		
dYqlPvlLknKXz6iT3Kf8EalFmpna5DcB	aZhrTtukaR7ik16kLG6CQtaHXA18UZc7	OiF7CUnySKPjS2PIm2XJQ3cs1CBa5hnr	2026-04-20 16:29:13.722	2026-04-13 16:29:13.722	2026-04-13 16:29:13.722		Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0
urSF4XhTnBq7P7lnuRFlQPMQUyjv6K23	ON49xEseqKi5XJi5FvdSpnDrVdN7kuzT	xLyMiPMERaENBkqRW9SamaInFUzy5mXV	2026-04-20 16:29:53.261	2026-04-13 16:29:53.261	2026-04-13 16:29:53.261		
ZNl7qZ2MhXkne01frg1mJPNmxS26yDKS	ON49xEseqKi5XJi5FvdSpnDrVdN7kuzT	Mnv27ABFADhbwG12mMJMFokaDApG0Nrh	2026-04-20 16:30:05.538	2026-04-13 16:30:05.538	2026-04-13 16:30:05.538		Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0
NylbGfhBp5xWG8Lu80g7CaFqc8Ifwoli	qa3bIsRop6Yg82IxmBaLBK3RibFAJt3w	W44hWZZ2cAhlzl8PsjWQC6mMo5j2h4Rf	2026-04-20 16:40:14.041	2026-04-13 16:40:14.041	2026-04-13 16:40:14.041		Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0
SacSSxG7Bm2ieCpEJMvv6eX2LzD5Ozga	qa3bIsRop6Yg82IxmBaLBK3RibFAJt3w	hj2jbeUCMmM5AXheKR1m03p8z0dAS987	2026-04-21 09:34:41.828	2026-04-14 09:34:41.828	2026-04-14 09:34:41.828		Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0
LWU1NRpxZmard78zp5zajsaEzm99c8tR	qa3bIsRop6Yg82IxmBaLBK3RibFAJt3w	saXOlmj8dIorX5IpufCcl2aabHFIHZ54	2026-04-21 10:45:50.571	2026-04-14 10:45:50.571	2026-04-14 10:45:50.571		Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0
31lUK0D8Kx68tDUOFsUI8FawYAZBe7P1	60v6F3ya4TJe0TnHaZJfTXwh0uwLks02	vWZrlakDRxbRXGf8VIx8keSgHZH1oWRY	2026-04-21 10:46:45.59	2026-04-14 10:46:45.59	2026-04-14 10:46:45.59		
yvSrMidPl6apJqfczUATsTXs9PaLjUCu	qa3bIsRop6Yg82IxmBaLBK3RibFAJt3w	Cp5T0PVFPBf81LhHM67DUPPsXuPiE3OO	2026-04-21 10:53:39.28	2026-04-14 10:53:39.28	2026-04-14 10:53:39.28		Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0
\.


--
-- TOC entry 5079 (class 0 OID 16589)
-- Dependencies: 225
-- Data for Name: tamplates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tamplates (id, user_id, name, desciption, page_type, template_data, thumbnail, is_public, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5075 (class 0 OID 16520)
-- Dependencies: 221
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (id, email, email_verified, image, password, created_at, updated_at, role, usertype, name) FROM stdin;
qa3bIsRop6Yg82IxmBaLBK3RibFAJt3w	superadmin@gmail.com	f	\N	\N	2026-04-13 15:55:22.003	2026-04-13 15:55:22.003	superadmin	superadmin	SuperAdmin
aZhrTtukaR7ik16kLG6CQtaHXA18UZc7	nascimentoxdavid@gmail.com	f	\N	\N	2026-04-13 16:24:00.25	2026-04-13 16:24:00.25	admin	admin	David Nascimento
ON49xEseqKi5XJi5FvdSpnDrVdN7kuzT	test@gmail.com	f	\N	\N	2026-04-13 16:29:53.254	2026-04-13 16:29:53.254	user	user	David Nascimento
60v6F3ya4TJe0TnHaZJfTXwh0uwLks02	pedro@gmail.com	f	http://localhost:3001/avatars/abe4afa8-4415-4abb-9c7d-ad92e70b274f.jpeg	ce7784c51b96671c96f4d34a7b388912:961bbd0321fdc0092bc2fbee5a0e3b34faa60751ebd73a3efd41a917805466c39c16e1103cd0bfd690ce4e73623826914588e8180721f9863829154220bc16f5	2026-04-14 10:46:45.581	2026-04-14 10:50:01.000033	admin	admin	Pedro
\.


--
-- TOC entry 5078 (class 0 OID 16575)
-- Dependencies: 224
-- Data for Name: verification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verification (id, identifier, value, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5087 (class 0 OID 0)
-- Dependencies: 219
-- Name: recovery_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recovery_codes_id_seq', 6, true);


--
-- TOC entry 4915 (class 2606 OID 16569)
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- TOC entry 4921 (class 2606 OID 16624)
-- Name: admin_reports admin_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_reports
    ADD CONSTRAINT admin_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 4905 (class 2606 OID 16519)
-- Name: recovery_codes recovery_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recovery_codes
    ADD CONSTRAINT recovery_codes_pkey PRIMARY KEY (id);


--
-- TOC entry 4911 (class 2606 OID 16548)
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- TOC entry 4913 (class 2606 OID 16550)
-- Name: session session_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- TOC entry 4919 (class 2606 OID 16604)
-- Name: tamplates tamplates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tamplates
    ADD CONSTRAINT tamplates_pkey PRIMARY KEY (id);


--
-- TOC entry 4907 (class 2606 OID 16534)
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- TOC entry 4909 (class 2606 OID 16532)
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- TOC entry 4917 (class 2606 OID 16588)
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- TOC entry 4923 (class 2606 OID 16570)
-- Name: account account_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- TOC entry 4924 (class 2606 OID 16630)
-- Name: admin_reports admin_reports_reporter_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_reports
    ADD CONSTRAINT admin_reports_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- TOC entry 4925 (class 2606 OID 16625)
-- Name: admin_reports admin_reports_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_reports
    ADD CONSTRAINT admin_reports_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- TOC entry 4922 (class 2606 OID 16551)
-- Name: session session_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


-- Completed on 2026-04-14 14:48:06

--
-- PostgreSQL database dump complete
--

\unrestrict 1tuUcYpeqooIHPpfwABYc8mitjeqfTEvWmDit5Jg0WjdAUEDfc9l2bShFCyPlcr

